'use client'

import { useState } from 'react'
import { TouchButton, TouchInput, TouchCard, TouchToggle, SwipeHandler } from '../layout/TouchInterface'
import { LoadingState, ActionFeedback, StepProgress } from './LoadingIndicator'
import { FeedbackOverlay, InlineFeedback, FloatingFeedback, ProgressTracker, useFeedback } from './FeedbackSystem'
import InteractiveButton, { InteractiveCard, InteractiveInput } from './InteractiveButton'

// Demo component showcasing all UI feedback and interaction features
export default function InteractionDemo() {
  const [inputValue, setInputValue] = useState('')
  const [toggleValue, setToggleValue] = useState(false)
  const [showOverlay, setShowOverlay] = useState(false)
  const [showFloating, setShowFloating] = useState(false)
  const [actionStatus, setActionStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)
  
  const { feedback, showLoading, showSuccess, showError, hide } = useFeedback()

  const steps = [
    { id: 'step1', title: 'Initialize', description: 'Setting up the process' },
    { id: 'step2', title: 'Process', description: 'Processing your request' },
    { id: 'step3', title: 'Validate', description: 'Validating results' },
    { id: 'step4', title: 'Complete', description: 'Finishing up' }
  ]

  const simulateAction = async (type: 'success' | 'error') => {
    setActionStatus('loading')
    
    // Simulate progress
    for (let i = 0; i <= 100; i += 10) {
      setProgress(i)
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    await new Promise(resolve => setTimeout(resolve, 500))
    setActionStatus(type)
    
    setTimeout(() => {
      setActionStatus('idle')
      setProgress(0)
    }, 2000)
  }

  const simulateStepProcess = async () => {
    showLoading('Starting process...')
    
    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(i)
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    showSuccess('Process completed successfully!')
    setTimeout(() => {
      hide()
      setCurrentStep(0)
    }, 2000)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">UI Feedback & Interaction Demo</h1>

      {/* Touch-Friendly Components */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">Touch-Friendly Components</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Touch Buttons</h3>
            <div className="space-y-3">
              <TouchButton variant="primary">Primary Button</TouchButton>
              <TouchButton variant="secondary" size="lg">Large Secondary</TouchButton>
              <TouchButton variant="ghost" loading>Loading Button</TouchButton>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Touch Inputs</h3>
            <TouchInput
              label="Touch-friendly Input"
              placeholder="Type something..."
              value={inputValue}
              onChange={setInputValue}
            />
            <TouchInput
              label="Error State"
              error="This field is required"
              required
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Interactive Elements</h3>
          <div className="flex flex-wrap gap-4 items-center">
            <TouchToggle
              checked={toggleValue}
              onChange={setToggleValue}
              label="Enable feature"
            />
            <TouchToggle
              checked={false}
              onChange={() => {}}
              label="Large toggle"
              size="lg"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Swipeable Card</h3>
          <SwipeHandler
            onSwipeLeft={() => setShowFloating(true)}
            onSwipeRight={() => setShowFloating(true)}
          >
            <TouchCard className="p-6 text-center">
              <p className="text-gray-600">Swipe left or right on this card</p>
              <p className="text-sm text-gray-500 mt-2">On desktop, you can click and drag</p>
            </TouchCard>
          </SwipeHandler>
        </div>
      </section>

      {/* Loading States */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">Loading States</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Loading Indicators</h3>
            <div className="space-y-3">
              <LoadingState type="spinner" text="Loading..." />
              <LoadingState type="dots" color="blue" text="Processing..." />
              <LoadingState type="pulse" size="lg" />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Progress Feedback</h3>
            <div className="space-y-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full smooth-transition"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600">{progress}% complete</p>
            </div>
          </div>
        </div>
      </section>

      {/* Action Feedback */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">Action Feedback</h2>
        
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <TouchButton onClick={() => simulateAction('success')}>
              Simulate Success
            </TouchButton>
            <TouchButton onClick={() => simulateAction('error')} variant="secondary">
              Simulate Error
            </TouchButton>
            <TouchButton onClick={() => setShowOverlay(true)} variant="ghost">
              Show Overlay
            </TouchButton>
          </div>

          <ActionFeedback
            action="save"
            status={actionStatus}
            message={
              actionStatus === 'loading' ? 'Saving changes...' :
              actionStatus === 'success' ? 'Changes saved successfully!' :
              actionStatus === 'error' ? 'Failed to save changes' :
              undefined
            }
            onRetry={() => simulateAction('success')}
          />

          <InlineFeedback
            status={actionStatus}
            message={
              actionStatus === 'loading' ? 'Processing your request...' :
              actionStatus === 'success' ? 'Operation completed!' :
              actionStatus === 'error' ? 'Something went wrong' :
              undefined
            }
          />
        </div>
      </section>

      {/* Step Progress */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">Step Progress</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <TouchButton onClick={simulateStepProcess}>
              Start Multi-Step Process
            </TouchButton>
            
            <div className="mt-4">
              <StepProgress
                steps={steps.map(s => s.title)}
                currentStep={currentStep}
                completedSteps={Array.from({ length: currentStep }, (_, i) => i)}
              />
            </div>
          </div>

          <div>
            <ProgressTracker
              steps={steps}
              currentStepId={steps[currentStep]?.id || steps[0].id}
              completedStepIds={steps.slice(0, currentStep).map(s => s.id)}
            />
          </div>
        </div>
      </section>

      {/* Interactive Components */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">Enhanced Interactive Components</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <InteractiveButton variant="primary" size="lg">
              Enhanced Button
            </InteractiveButton>
            
            <InteractiveCard hoverable elevated className="p-4">
              <h4 className="font-medium">Interactive Card</h4>
              <p className="text-sm text-gray-600 mt-2">
                This card has hover effects and smooth animations
              </p>
            </InteractiveCard>
          </div>

          <div className="space-y-4">
            <InteractiveInput
              label="Enhanced Input"
              placeholder="Try typing here..."
              success={inputValue.length > 5 ? "Good input!" : undefined}
            />
          </div>
        </div>
      </section>

      {/* Overlays and Floating Feedback */}
      <FeedbackOverlay
        isVisible={showOverlay}
        title="Processing Request"
        message="Please wait while we process your request..."
        type="loading"
        progress={progress}
        onClose={() => setShowOverlay(false)}
      />

      <FloatingFeedback
        isVisible={showFloating}
        message="Swipe detected!"
        type="success"
        onHide={() => setShowFloating(false)}
      />

      {feedback.loading && (
        <FeedbackOverlay
          isVisible={feedback.loading}
          title="Processing"
          message={feedback.message}
          type="loading"
          onClose={hide}
        />
      )}
    </div>
  )
}