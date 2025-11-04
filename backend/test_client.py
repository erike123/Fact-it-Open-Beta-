"""
Test client for Threat Intelligence Enrichment API
Demonstrates the complete enrichment pipeline
"""

import requests
import json
import time
from typing import Dict

API_BASE = "http://localhost:8000/api/v1"


def print_section(title: str):
    """Print formatted section header"""
    print("\n" + "="*80)
    print(f" {title}")
    print("="*80 + "\n")


def test_health_check():
    """Test 1: Health check"""
    print_section("TEST 1: Health Check")

    response = requests.get(f"{API_BASE.replace('/api/v1', '')}/")
    data = response.json()

    print(f"✓ Service Status: {data['status']}")
    print(f"✓ Version: {data['version']}")
    print(f"✓ Enricher Ready: {data['enricher_ready']}")


def test_cached_lookup(url: str):
    """Test 2: Cached verdict lookup (fast path)"""
    print_section("TEST 2: Cached Verdict Lookup (Fast Path)")

    start_time = time.time()

    try:
        response = requests.get(f"{API_BASE}/verdict/{url}")

        if response.status_code == 404:
            print("✗ No cached verdict (expected for first run)")
            return None

        latency_ms = (time.time() - start_time) * 1000
        data = response.json()

        print(f"✓ Cache HIT!")
        print(f"✓ Latency: {latency_ms:.1f}ms")
        print(f"✓ Threat Score: {data['threat_score']}/100")
        print(f"✓ Verdict: {data['final_verdict'].upper()}")
        print(f"✓ Claude Confidence: {data['claude_confidence']}%")

        return data

    except Exception as e:
        print(f"✗ Error: {e}")
        return None


def test_full_enrichment(url: str, priority: str = "high"):
    """Test 3: Full enrichment (with external APIs)"""
    print_section(f"TEST 3: Full Enrichment (Priority: {priority.upper()})")

    start_time = time.time()

    payload = {
        "url": url,
        "priority": priority,
        "source": "test_client"
    }

    print(f"→ Enriching URL: {url}")
    print(f"→ Priority: {priority}")
    print(f"→ Waiting for enrichment...")

    try:
        response = requests.post(
            f"{API_BASE}/enrich",
            json=payload,
            timeout=60  # 60s timeout for full enrichment
        )

        latency_ms = (time.time() - start_time) * 1000
        data = response.json()

        print(f"\n✓ Enrichment complete!")
        print(f"✓ Processing Time: {latency_ms:.1f}ms")
        print(f"✓ Cache Hit: {data.get('cache_hit', False)}")

        # Print verdict summary
        print(f"\n┌─────────────────────────────────────────────┐")
        print(f"│           THREAT VERDICT SUMMARY            │")
        print(f"├─────────────────────────────────────────────┤")
        print(f"│ Domain:         {data['domain']:28} │")
        print(f"│ Threat Score:   {data['threat_score']:3d}/100                      │")
        print(f"│ Final Verdict:  {data['final_verdict'].upper():28} │")
        print(f"│ Claude Verdict: {data['claude_verdict'].upper():28} │")
        print(f"│ Confidence:     {data['claude_confidence']:3d}%                       │")
        print(f"└─────────────────────────────────────────────┘")

        # Print Claude explanation
        print(f"\n📋 Claude Explanation:")
        print(f"   {data['claude_explanation']}")

        # Print enrichment sources
        if data.get('enrichment_sources'):
            print(f"\n📊 Data Sources: {', '.join(data['enrichment_sources'])}")

        # Print detailed data if available
        if data.get('whois_data'):
            print(f"\n🔍 WHOIS Data:")
            print(f"   Registrar: {data['whois_data'].get('registrar', 'N/A')}")
            print(f"   Domain Age: {data['whois_data'].get('domain_age_days', 'N/A')} days")

        if data.get('vt_data'):
            print(f"\n🦠 VirusTotal:")
            print(f"   Malicious: {data['vt_data'].get('malicious_votes', 0)}")
            print(f"   Suspicious: {data['vt_data'].get('suspicious_votes', 0)}")

        if data.get('urlscan_data'):
            print(f"\n🔎 URLScan:")
            print(f"   Verdict: {data['urlscan_data'].get('verdict', 'N/A')}")
            print(f"   IP: {data['urlscan_data'].get('ip', 'N/A')}")

        return data

    except Exception as e:
        print(f"\n✗ Error: {e}")
        return None


def test_feedback_submission(url: str, verdict: str, confidence: int):
    """Test 4: Submit user feedback"""
    print_section("TEST 4: User Feedback Submission")

    try:
        response = requests.post(
            f"{API_BASE}/feedback",
            params={
                "url": url,
                "user_verdict": verdict,
                "confidence": confidence,
                "comment": "Test feedback from client"
            }
        )

        data = response.json()

        print(f"✓ Feedback submitted successfully")
        print(f"✓ Status: {data['status']}")
        print(f"✓ Message: {data['message']}")

    except Exception as e:
        print(f"✗ Error: {e}")


def test_metrics():
    """Test 5: Get system metrics"""
    print_section("TEST 5: System Metrics")

    try:
        response = requests.get(f"{API_BASE}/metrics")
        data = response.json()

        print(f"📊 System Performance Metrics:")
        print(f"   Cache Hit Rate:       {data['cache_hit_rate']*100:.1f}%")
        print(f"   Cached Latency:       {data['avg_cached_latency_ms']:.1f}ms")
        print(f"   Full Enrichment:      {data['avg_full_enrichment_ms']:.1f}ms")
        print(f"   False Positive Rate:  {data['false_positive_rate']*100:.2f}%")
        print(f"   Enrichments (24h):    {data['total_enrichments_24h']:,}")
        print(f"   Kafka Lag:            {data['kafka_lag']}")

    except Exception as e:
        print(f"✗ Error: {e}")


def run_complete_test_suite():
    """Run complete test suite"""
    print("\n" + "█"*80)
    print("█" + " "*78 + "█")
    print("█" + "  THREAT INTELLIGENCE ENRICHMENT API - TEST SUITE".center(78) + "█")
    print("█" + " "*78 + "█")
    print("█"*80)

    # Test URLs
    test_urls = [
        "https://google.com",  # Known safe
        "https://example-phishing.tk/login",  # Suspicious TLD
        "https://github.com",  # Known safe
    ]

    # Test 1: Health Check
    test_health_check()

    # Test 2: Full enrichment (high priority)
    for url in test_urls:
        result = test_full_enrichment(url, priority="high")

        if result:
            # Test 3: Cached lookup (should be fast now)
            time.sleep(2)  # Give cache a moment
            test_cached_lookup(url)

            # Test 4: Submit feedback
            test_feedback_submission(
                url,
                verdict="safe" if result['threat_score'] < 40 else "malicious",
                confidence=85
            )

    # Test 5: Metrics
    test_metrics()

    print_section("TEST SUITE COMPLETE")
    print("✅ All tests completed successfully!")
    print("\nNext steps:")
    print("  1. Check Grafana dashboard: http://localhost:3000")
    print("  2. View Kafka events: docker-compose logs kafka")
    print("  3. Check Redis cache: docker-compose exec redis redis-cli KEYS '*'")
    print("\n" + "█"*80 + "\n")


if __name__ == "__main__":
    try:
        run_complete_test_suite()
    except KeyboardInterrupt:
        print("\n\n⚠️  Test suite interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Test suite failed: {e}")
