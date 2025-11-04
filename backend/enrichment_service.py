"""
Threat Intelligence Enrichment Service
Enriches URLs/domains with WHOIS, VirusTotal, URLScan, and Claude verdict
"""

import os
import json
import time
import hashlib
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from enum import Enum

import requests
import whois
from anthropic import Anthropic
from kafka import KafkaProducer
import redis

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class ThreatVerdict(Enum):
    """Threat verdict categories"""
    SAFE = "safe"
    SUSPICIOUS = "suspicious"
    MALICIOUS = "malicious"
    UNKNOWN = "unknown"


@dataclass
class EnrichedThreatData:
    """Enriched threat intelligence data"""
    url: str
    domain: str
    timestamp: str

    # WHOIS data
    whois_registrar: Optional[str] = None
    whois_creation_date: Optional[str] = None
    whois_expiration_date: Optional[str] = None
    whois_name_servers: Optional[List[str]] = None
    domain_age_days: Optional[int] = None

    # VirusTotal data
    vt_malicious_votes: int = 0
    vt_suspicious_votes: int = 0
    vt_harmless_votes: int = 0
    vt_community_score: int = 0
    vt_categories: Optional[List[str]] = None
    vt_last_analysis_date: Optional[str] = None

    # URLScan data
    urlscan_verdict: Optional[str] = None
    urlscan_brands: Optional[List[str]] = None
    urlscan_screenshot_url: Optional[str] = None
    urlscan_ip: Optional[str] = None
    urlscan_asn: Optional[str] = None

    # Claude AI verdict
    claude_verdict: str = "unknown"
    claude_confidence: int = 0
    claude_explanation: str = ""
    claude_risk_factors: Optional[List[str]] = None

    # Final scoring
    threat_score: int = 0  # 0-100
    final_verdict: str = ThreatVerdict.UNKNOWN.value

    # Metadata
    processing_time_ms: int = 0
    cache_hit: bool = False
    enrichment_sources: Optional[List[str]] = None


class ThreatIntelligenceEnricher:
    """Main enrichment orchestrator"""

    def __init__(
        self,
        virustotal_api_key: str,
        urlscan_api_key: str,
        anthropic_api_key: str,
        redis_host: str = "localhost",
        redis_port: int = 6379,
        kafka_bootstrap_servers: str = "localhost:9092",
        cache_ttl_hours: int = 24
    ):
        self.vt_api_key = virustotal_api_key
        self.urlscan_api_key = urlscan_api_key
        self.anthropic_client = Anthropic(api_key=anthropic_api_key)

        # Redis cache
        self.redis_client = redis.Redis(
            host=redis_host,
            port=redis_port,
            db=0,
            decode_responses=True
        )
        self.cache_ttl = timedelta(hours=cache_ttl_hours)

        # Kafka producer
        self.kafka_producer = KafkaProducer(
            bootstrap_servers=[kafka_bootstrap_servers],
            value_serializer=lambda v: json.dumps(v).encode('utf-8'),
            compression_type='gzip'
        )

        logger.info("ThreatIntelligenceEnricher initialized")

    def _get_cache_key(self, url: str) -> str:
        """Generate cache key for URL"""
        return f"threat_intel:{hashlib.sha256(url.encode()).hexdigest()}"

    def _check_cache(self, url: str) -> Optional[Dict]:
        """Check Redis cache for existing enrichment"""
        try:
            cache_key = self._get_cache_key(url)
            cached = self.redis_client.get(cache_key)
            if cached:
                logger.info(f"Cache HIT for {url}")
                return json.loads(cached)
            logger.info(f"Cache MISS for {url}")
            return None
        except Exception as e:
            logger.error(f"Cache check error: {e}")
            return None

    def _store_cache(self, url: str, data: Dict):
        """Store enriched data in Redis cache"""
        try:
            cache_key = self._get_cache_key(url)
            self.redis_client.setex(
                cache_key,
                int(self.cache_ttl.total_seconds()),
                json.dumps(data)
            )
            logger.info(f"Cached enrichment for {url}")
        except Exception as e:
            logger.error(f"Cache store error: {e}")

    def enrich_whois(self, domain: str) -> Dict[str, Any]:
        """Enrich with WHOIS data"""
        try:
            logger.info(f"WHOIS lookup for {domain}")
            w = whois.whois(domain)

            # Calculate domain age
            creation_date = w.creation_date
            if isinstance(creation_date, list):
                creation_date = creation_date[0]

            domain_age = None
            if creation_date:
                domain_age = (datetime.now() - creation_date).days

            return {
                "registrar": w.registrar,
                "creation_date": str(creation_date) if creation_date else None,
                "expiration_date": str(w.expiration_date) if w.expiration_date else None,
                "name_servers": w.name_servers if w.name_servers else [],
                "domain_age_days": domain_age
            }
        except Exception as e:
            logger.warning(f"WHOIS error for {domain}: {e}")
            return {}

    def enrich_virustotal(self, url: str) -> Dict[str, Any]:
        """Enrich with VirusTotal data"""
        try:
            logger.info(f"VirusTotal lookup for {url}")

            # URL ID for VT API
            url_id = hashlib.sha256(url.encode()).hexdigest()

            headers = {
                "x-apikey": self.vt_api_key
            }

            # Check if URL analysis exists
            response = requests.get(
                f"https://www.virustotal.com/api/v3/urls/{url_id}",
                headers=headers,
                timeout=10
            )

            if response.status_code == 404:
                # Submit for scanning
                scan_response = requests.post(
                    "https://www.virustotal.com/api/v3/urls",
                    headers=headers,
                    data={"url": url},
                    timeout=10
                )
                logger.info(f"Submitted {url} to VirusTotal for scanning")
                return {"status": "pending_scan"}

            if response.status_code == 200:
                data = response.json()
                attributes = data.get("data", {}).get("attributes", {})
                stats = attributes.get("last_analysis_stats", {})

                return {
                    "malicious_votes": stats.get("malicious", 0),
                    "suspicious_votes": stats.get("suspicious", 0),
                    "harmless_votes": stats.get("harmless", 0),
                    "community_score": attributes.get("reputation", 0),
                    "categories": list(attributes.get("categories", {}).values()),
                    "last_analysis_date": attributes.get("last_analysis_date", None)
                }

            logger.warning(f"VirusTotal API error: {response.status_code}")
            return {}

        except Exception as e:
            logger.error(f"VirusTotal error for {url}: {e}")
            return {}

    def enrich_urlscan(self, url: str) -> Dict[str, Any]:
        """Enrich with URLScan.io data"""
        try:
            logger.info(f"URLScan lookup for {url}")

            headers = {
                "API-Key": self.urlscan_api_key,
                "Content-Type": "application/json"
            }

            # Submit URL for scanning
            scan_response = requests.post(
                "https://urlscan.io/api/v1/scan/",
                headers=headers,
                json={"url": url, "visibility": "public"},
                timeout=10
            )

            if scan_response.status_code == 200:
                scan_data = scan_response.json()
                result_url = scan_data.get("api")

                # Wait for scan to complete (max 30 seconds)
                for _ in range(6):
                    time.sleep(5)
                    result_response = requests.get(result_url, headers=headers, timeout=10)

                    if result_response.status_code == 200:
                        result = result_response.json()
                        verdicts = result.get("verdicts", {})
                        page = result.get("page", {})

                        return {
                            "verdict": verdicts.get("overall", {}).get("score", 0),
                            "brands": verdicts.get("urlscan", {}).get("brands", []),
                            "screenshot_url": result.get("task", {}).get("screenshotURL", None),
                            "ip": page.get("ip", None),
                            "asn": page.get("asn", None)
                        }

                logger.warning(f"URLScan timeout for {url}")
                return {"status": "timeout"}

            logger.warning(f"URLScan API error: {scan_response.status_code}")
            return {}

        except Exception as e:
            logger.error(f"URLScan error for {url}: {e}")
            return {}

    def enrich_claude_verdict(
        self,
        url: str,
        domain: str,
        whois_data: Dict,
        vt_data: Dict,
        urlscan_data: Dict
    ) -> Dict[str, Any]:
        """Generate AI verdict using Claude"""
        try:
            logger.info(f"Claude verdict generation for {url}")

            # Build context for Claude
            context = f"""Analyze this URL for security threats:

URL: {url}
Domain: {domain}

WHOIS DATA:
- Registrar: {whois_data.get('registrar', 'Unknown')}
- Domain Age: {whois_data.get('domain_age_days', 'Unknown')} days
- Creation Date: {whois_data.get('creation_date', 'Unknown')}

VIRUSTOTAL DATA:
- Malicious Votes: {vt_data.get('malicious_votes', 0)}
- Suspicious Votes: {vt_data.get('suspicious_votes', 0)}
- Harmless Votes: {vt_data.get('harmless_votes', 0)}
- Community Score: {vt_data.get('community_score', 0)}
- Categories: {', '.join(vt_data.get('categories', []))}

URLSCAN DATA:
- Verdict Score: {urlscan_data.get('verdict', 'Unknown')}
- Detected Brands: {', '.join(urlscan_data.get('brands', []))}
- IP Address: {urlscan_data.get('ip', 'Unknown')}

Based on this data, provide a security verdict."""

            # Call Claude API
            message = self.anthropic_client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=500,
                temperature=0.3,
                system="You are a cybersecurity threat analyst. Analyze the provided URL enrichment data and return a JSON verdict with: verdict (safe/suspicious/malicious/unknown), confidence (0-100), explanation (1-2 sentences), and risk_factors (array of specific concerns).",
                messages=[{
                    "role": "user",
                    "content": context + "\n\nReturn only valid JSON."
                }]
            )

            # Parse Claude response
            response_text = message.content[0].text

            # Extract JSON from response
            import re
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                verdict = json.loads(json_match.group())
                return {
                    "verdict": verdict.get("verdict", "unknown"),
                    "confidence": verdict.get("confidence", 0),
                    "explanation": verdict.get("explanation", ""),
                    "risk_factors": verdict.get("risk_factors", [])
                }

            logger.warning(f"Could not parse Claude response: {response_text[:100]}")
            return {
                "verdict": "unknown",
                "confidence": 0,
                "explanation": "Failed to parse AI verdict",
                "risk_factors": []
            }

        except Exception as e:
            logger.error(f"Claude verdict error for {url}: {e}")
            return {
                "verdict": "unknown",
                "confidence": 0,
                "explanation": f"Error: {str(e)}",
                "risk_factors": []
            }

    def calculate_threat_score(
        self,
        whois_data: Dict,
        vt_data: Dict,
        urlscan_data: Dict,
        claude_data: Dict
    ) -> tuple[int, str]:
        """Calculate final threat score (0-100) and verdict"""
        score = 0

        # WHOIS scoring (max 20 points risk)
        domain_age = whois_data.get('domain_age_days', 999999)
        if domain_age < 30:
            score += 20  # Very new domain
        elif domain_age < 90:
            score += 10  # Relatively new

        # VirusTotal scoring (max 40 points risk)
        vt_malicious = vt_data.get('malicious_votes', 0)
        vt_suspicious = vt_data.get('suspicious_votes', 0)

        if vt_malicious > 5:
            score += 40
        elif vt_malicious > 0:
            score += 20 + (vt_malicious * 2)

        if vt_suspicious > 3:
            score += 10

        # URLScan scoring (max 20 points risk)
        urlscan_verdict = urlscan_data.get('verdict', 0)
        if urlscan_verdict > 50:
            score += 20
        elif urlscan_verdict > 20:
            score += 10

        # Claude AI scoring (max 20 points risk)
        claude_verdict = claude_data.get('verdict', 'unknown')
        claude_confidence = claude_data.get('confidence', 0)

        if claude_verdict == 'malicious':
            score += 20
        elif claude_verdict == 'suspicious':
            score += 10

        # Adjust by confidence
        if claude_confidence > 80:
            score = int(score * 1.2)  # Boost if high confidence

        # Cap at 100
        score = min(score, 100)

        # Determine final verdict
        if score >= 70:
            final_verdict = ThreatVerdict.MALICIOUS.value
        elif score >= 40:
            final_verdict = ThreatVerdict.SUSPICIOUS.value
        elif score < 20:
            final_verdict = ThreatVerdict.SAFE.value
        else:
            final_verdict = ThreatVerdict.UNKNOWN.value

        return score, final_verdict

    def enrich(self, url: str) -> EnrichedThreatData:
        """Main enrichment orchestrator"""
        start_time = time.time()

        logger.info(f"=== Starting enrichment for {url} ===")

        # Check cache
        cached_data = self._check_cache(url)
        if cached_data:
            cached_data['cache_hit'] = True
            cached_data['processing_time_ms'] = int((time.time() - start_time) * 1000)
            return EnrichedThreatData(**cached_data)

        # Extract domain
        from urllib.parse import urlparse
        parsed = urlparse(url)
        domain = parsed.netloc or parsed.path.split('/')[0]

        # Initialize result
        enrichment_sources = []

        # Enrich with WHOIS
        whois_data = self.enrich_whois(domain)
        if whois_data:
            enrichment_sources.append("whois")

        # Enrich with VirusTotal
        vt_data = self.enrich_virustotal(url)
        if vt_data and vt_data.get("status") != "pending_scan":
            enrichment_sources.append("virustotal")

        # Enrich with URLScan
        urlscan_data = self.enrich_urlscan(url)
        if urlscan_data and urlscan_data.get("status") != "timeout":
            enrichment_sources.append("urlscan")

        # Generate Claude verdict
        claude_data = self.enrich_claude_verdict(url, domain, whois_data, vt_data, urlscan_data)
        enrichment_sources.append("claude")

        # Calculate threat score
        threat_score, final_verdict = self.calculate_threat_score(
            whois_data, vt_data, urlscan_data, claude_data
        )

        # Build enriched data object
        enriched = EnrichedThreatData(
            url=url,
            domain=domain,
            timestamp=datetime.utcnow().isoformat(),

            # WHOIS
            whois_registrar=whois_data.get('registrar'),
            whois_creation_date=whois_data.get('creation_date'),
            whois_expiration_date=whois_data.get('expiration_date'),
            whois_name_servers=whois_data.get('name_servers'),
            domain_age_days=whois_data.get('domain_age_days'),

            # VirusTotal
            vt_malicious_votes=vt_data.get('malicious_votes', 0),
            vt_suspicious_votes=vt_data.get('suspicious_votes', 0),
            vt_harmless_votes=vt_data.get('harmless_votes', 0),
            vt_community_score=vt_data.get('community_score', 0),
            vt_categories=vt_data.get('categories'),
            vt_last_analysis_date=vt_data.get('last_analysis_date'),

            # URLScan
            urlscan_verdict=urlscan_data.get('verdict'),
            urlscan_brands=urlscan_data.get('brands'),
            urlscan_screenshot_url=urlscan_data.get('screenshot_url'),
            urlscan_ip=urlscan_data.get('ip'),
            urlscan_asn=urlscan_data.get('asn'),

            # Claude
            claude_verdict=claude_data.get('verdict', 'unknown'),
            claude_confidence=claude_data.get('confidence', 0),
            claude_explanation=claude_data.get('explanation', ''),
            claude_risk_factors=claude_data.get('risk_factors'),

            # Scoring
            threat_score=threat_score,
            final_verdict=final_verdict,

            # Metadata
            processing_time_ms=int((time.time() - start_time) * 1000),
            cache_hit=False,
            enrichment_sources=enrichment_sources
        )

        # Convert to dict for caching
        enriched_dict = asdict(enriched)

        # Store in cache
        self._store_cache(url, enriched_dict)

        # Send to Kafka
        self.send_to_kafka(enriched_dict)

        logger.info(f"=== Enrichment complete for {url} (score: {threat_score}, verdict: {final_verdict}) ===")

        return enriched

    def send_to_kafka(self, enriched_data: Dict):
        """Send enriched event to Kafka"""
        try:
            topic = "threat-intelligence-events"

            self.kafka_producer.send(
                topic,
                value=enriched_data,
                key=enriched_data['url'].encode('utf-8')
            )

            logger.info(f"Sent event to Kafka topic: {topic}")
        except Exception as e:
            logger.error(f"Kafka send error: {e}")

    def close(self):
        """Cleanup resources"""
        self.kafka_producer.close()
        self.redis_client.close()
        logger.info("ThreatIntelligenceEnricher closed")


# Example usage
if __name__ == "__main__":
    # Initialize enricher
    enricher = ThreatIntelligenceEnricher(
        virustotal_api_key=os.getenv("VIRUSTOTAL_API_KEY", ""),
        urlscan_api_key=os.getenv("URLSCAN_API_KEY", ""),
        anthropic_api_key=os.getenv("ANTHROPIC_API_KEY", ""),
        redis_host=os.getenv("REDIS_HOST", "localhost"),
        kafka_bootstrap_servers=os.getenv("KAFKA_BOOTSTRAP", "localhost:9092")
    )

    # Test URL
    test_url = "https://example-suspicious-domain.tk/phishing-page"

    # Enrich
    result = enricher.enrich(test_url)

    # Print results
    print("\n" + "="*80)
    print("ENRICHMENT RESULTS")
    print("="*80)
    print(json.dumps(asdict(result), indent=2))
    print("="*80)

    # Cleanup
    enricher.close()
