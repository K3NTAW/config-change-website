import { NextResponse } from 'next/server'
import { initializeData, isDataInitialized } from '@/lib/init-data'

export async function POST() {
  try {
    const alreadyInitialized = await isDataInitialized()
    
    if (alreadyInitialized) {
      return NextResponse.json({ 
        success: true, 
        message: 'Data already initialized' 
      })
    }

    const success = await initializeData()
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Data initialized successfully' 
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to initialize data' 
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Init API error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const initialized = await isDataInitialized()
    return NextResponse.json({ 
      initialized,
      message: initialized ? 'Data is initialized' : 'Data not initialized'
    })
  } catch (error) {
    console.error('Init check error:', error)
    return NextResponse.json({ 
      initialized: false,
      message: 'Error checking initialization status'
    }, { status: 500 })
  }
}
