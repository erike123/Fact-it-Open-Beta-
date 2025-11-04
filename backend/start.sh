#!/bin/bash

# Threat Intelligence Enrichment Pipeline - Quick Start Script

set -e  # Exit on error

echo "════════════════════════════════════════════════════════════════════════════"
echo "  🛡️  Threat Intelligence Enrichment Pipeline - Quick Start"
echo "════════════════════════════════════════════════════════════════════════════"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp .env.example .env
    echo "✅ Created .env file"
    echo ""
    echo "⚠️  IMPORTANT: Please edit .env and add your API keys:"
    echo "   - VIRUSTOTAL_API_KEY"
    echo "   - URLSCAN_API_KEY"
    echo "   - ANTHROPIC_API_KEY"
    echo ""
    echo "Press Enter to continue after adding API keys, or Ctrl+C to exit..."
    read
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "🔧 Starting infrastructure services..."
echo ""

# Start services
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check service health
echo ""
echo "📊 Service Status:"
echo "────────────────────────────────────────────────────────────────────────────"

# Redis
if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo "  ✅ Redis:      Running on port 6379"
else
    echo "  ❌ Redis:      Not responding"
fi

# Kafka
if docker-compose exec -T kafka kafka-broker-api-versions --bootstrap-server localhost:9092 > /dev/null 2>&1; then
    echo "  ✅ Kafka:      Running on port 9092"
else
    echo "  ⚠️  Kafka:      Starting up (may take 30-60s)"
fi

# API Service
sleep 5
if curl -s http://localhost:8000/ > /dev/null; then
    echo "  ✅ FastAPI:    Running on port 8000"
else
    echo "  ⚠️  FastAPI:    Starting up..."
fi

# Neo4j
if curl -s http://localhost:7474/ > /dev/null; then
    echo "  ✅ Neo4j:      Running on port 7474 (UI), 7687 (Bolt)"
else
    echo "  ⚠️  Neo4j:      Starting up..."
fi

# Grafana
if curl -s http://localhost:3000/ > /dev/null; then
    echo "  ✅ Grafana:    Running on port 3000"
else
    echo "  ⚠️  Grafana:    Starting up..."
fi

echo "────────────────────────────────────────────────────────────────────────────"
echo ""

echo "🎯 Quick Test:"
echo "────────────────────────────────────────────────────────────────────────────"
echo ""
echo "Testing API health check..."

if curl -s http://localhost:8000/ | grep -q "ok"; then
    echo "  ✅ API is responding correctly"
    echo ""
    echo "Running enrichment test..."
    echo ""

    # Test enrichment
    RESPONSE=$(curl -s -X POST http://localhost:8000/api/v1/enrich \
        -H "Content-Type: application/json" \
        -d '{"url": "https://google.com", "priority": "high"}')

    if echo "$RESPONSE" | grep -q "threat_score"; then
        THREAT_SCORE=$(echo "$RESPONSE" | grep -o '"threat_score":[0-9]*' | grep -o '[0-9]*')
        VERDICT=$(echo "$RESPONSE" | grep -o '"final_verdict":"[^"]*"' | cut -d'"' -f4)
        echo "  ✅ Enrichment successful!"
        echo "     URL: https://google.com"
        echo "     Threat Score: $THREAT_SCORE/100"
        echo "     Verdict: $VERDICT"
    else
        echo "  ⚠️  Enrichment pending (API keys may be missing)"
    fi
else
    echo "  ⚠️  API not ready yet. Wait 30s and try: curl http://localhost:8000/"
fi

echo ""
echo "════════════════════════════════════════════════════════════════════════════"
echo "  🚀 Threat Intelligence Pipeline is Ready!"
echo "════════════════════════════════════════════════════════════════════════════"
echo ""
echo "📚 Access Points:"
echo "   • API Documentation:  http://localhost:8000/docs"
echo "   • Grafana Dashboard:  http://localhost:3000 (admin/admin)"
echo "   • Neo4j Browser:      http://localhost:7474 (neo4j/threatintel123)"
echo "   • Prometheus:         http://localhost:9090"
echo ""
echo "🧪 Run Tests:"
echo "   python test_client.py"
echo ""
echo "📊 View Logs:"
echo "   docker-compose logs -f api"
echo "   docker-compose logs -f kafka"
echo ""
echo "🛑 Stop Services:"
echo "   docker-compose down"
echo ""
echo "📖 Full Documentation:"
echo "   cat README.md"
echo ""
echo "════════════════════════════════════════════════════════════════════════════"
