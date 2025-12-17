/**
 * Post-deployment verification script
 * Verifies that the deployment was successful
 */

interface HealthCheckResponse {
  status: string
  timestamp: string
  uptime: number
  checks: {
    database: {
      status: string
      responseTime?: number
    }
    memory: {
      used: number
      total: number
      percentage: number
    }
  }
}

async function checkHealth(url: string): Promise<boolean> {
  try {
    const response = await fetch(`${url}/api/health`)
    
    if (!response.ok) {
      console.error(`❌ Health check failed with status: ${response.status}`)
      return false
    }

    const data: HealthCheckResponse = await response.json()
    
    console.log('\n📊 Health Check Results:')
    console.log(`   Status: ${data.status}`)
    console.log(`   Uptime: ${Math.round(data.uptime)}s`)
    console.log(`   Database: ${data.checks.database.status} (${data.checks.database.responseTime}ms)`)
    console.log(`   Memory: ${data.checks.memory.used}MB / ${data.checks.memory.total}MB (${data.checks.memory.percentage}%)`)

    return data.status === 'healthy' || data.status === 'degraded'
  } catch (error) {
    console.error(`❌ Health check request failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return false
  }
}

async function checkReadiness(url: string): Promise<boolean> {
  try {
    const response = await fetch(`${url}/api/ready`)
    
    if (!response.ok) {
      console.error(`❌ Readiness check failed with status: ${response.status}`)
      return false
    }

    const data = await response.json()
    
    console.log('\n📊 Readiness Check Results:')
    console.log(`   Ready: ${data.ready}`)
    console.log(`   Database: ${data.checks.database ? '✅' : '❌'}`)
    console.log(`   Migrations: ${data.checks.migrations ? '✅' : '❌'}`)

    if (data.errors && data.errors.length > 0) {
      console.log('\n   Errors:')
      data.errors.forEach((error: string) => console.log(`   - ${error}`))
    }

    return data.ready
  } catch (error) {
    console.error(`❌ Readiness check request failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return false
  }
}

async function verifyEndpoints(url: string): Promise<boolean> {
  console.log('\n🔍 Verifying critical endpoints...')
  
  const endpoints = [
    { path: '/', name: 'Home page' },
    { path: '/api/products', name: 'Products API' },
  ]

  let allPassed = true

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${url}${endpoint.path}`)
      if (response.ok) {
        console.log(`   ✅ ${endpoint.name}: ${response.status}`)
      } else {
        console.log(`   ❌ ${endpoint.name}: ${response.status}`)
        allPassed = false
      }
    } catch (error) {
      console.log(`   ❌ ${endpoint.name}: Failed to connect`)
      allPassed = false
    }
  }

  return allPassed
}

async function main() {
  const deploymentUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  
  console.log('🚀 Post-deployment verification\n')
  console.log('='.repeat(50))
  console.log(`\nTarget URL: ${deploymentUrl}\n`)

  let allChecksPassed = true

  // Wait a bit for the application to fully start
  console.log('⏳ Waiting for application to start...')
  await new Promise(resolve => setTimeout(resolve, 5000))

  // Run health check
  console.log('\n🏥 Running health check...')
  const healthPassed = await checkHealth(deploymentUrl)
  if (!healthPassed) {
    allChecksPassed = false
  }

  // Run readiness check
  console.log('\n🎯 Running readiness check...')
  const readinessPassed = await checkReadiness(deploymentUrl)
  if (!readinessPassed) {
    allChecksPassed = false
  }

  // Verify critical endpoints
  const endpointsPassed = await verifyEndpoints(deploymentUrl)
  if (!endpointsPassed) {
    allChecksPassed = false
  }

  console.log('\n' + '='.repeat(50))
  
  if (allChecksPassed) {
    console.log('\n✅ All post-deployment checks passed!')
    console.log('🎉 Deployment verified successfully\n')
    process.exit(0)
  } else {
    console.log('\n❌ Some post-deployment checks failed')
    console.log('⚠️  Please investigate the issues above\n')
    process.exit(1)
  }
}

main()
