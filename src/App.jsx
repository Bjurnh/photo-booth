import { useState, useMemo, useEffect, useCallback } from 'react'
import HomeScreen from './components/HomeScreen'
import LayoutPicker from './components/LayoutPicker'
import TemplatePicker from './components/TemplatePicker'
import FilterPicker from './components/FilterPicker'
import CameraCapture from './components/CameraCapture'
import ReviewScreen from './components/ReviewScreen'
import PrintScreen from './components/PrintScreen'
import SettingsPanel from './components/SettingsPanel'
import IdleWarning from './components/IdleWarning'
import { getFilterById } from './utils/filters'
import { composeLayout, applyCssFilter } from './utils/canvasComposite'
import { loadStoredTemplates, saveStoredTemplates, loadImageFromUrl } from './utils/templateStorage'
import { useIdleReset } from './hooks/useIdleReset'
import { createCaptureError, CAPTURE_ERROR_CODES } from './utils/errors'
import { logger } from './utils/logger'
import { getLayoutById } from './layouts/layoutDefinitions'

const SCREENS = {
  HOME: 'HOME',
  LAYOUT: 'LAYOUT',
  TEMPLATE: 'TEMPLATE',
  FILTER: 'FILTER',
  CAPTURE: 'CAPTURE',
  REVIEW: 'REVIEW',
  PRINT: 'PRINT',
}

export default function App() {
  const [screen, setScreen] = useState(SCREENS.HOME)
  const [showSettings, setShowSettings] = useState(false)
  const [templates, setTemplates] = useState(() => loadStoredTemplates())
  const [selectedLayoutId, setSelectedLayoutId] = useState('single')
  const [selectedTemplateId, setSelectedTemplateId] = useState(null)
  const [selectedFilterId, setSelectedFilterId] = useState('normal')
  const [finalDataUrl, setFinalDataUrl] = useState(null)
  const [capturedImages, setCapturedImages] = useState([])
  const [cameraDeviceId, setCameraDeviceId] = useState(null)
  const [captureError, setCaptureError] = useState(null)

  // Persist templates any time they change, so an uploaded template survives
  // a refresh, crash, or the iPad restarting mid-event.
  useEffect(() => {
    saveStoredTemplates(templates)
  }, [templates])

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId) || null,
    [templates, selectedTemplateId]
  )
  const selectedFilter = getFilterById(selectedFilterId)
  const selectedLayout = useMemo(() => getLayoutById(selectedLayoutId), [selectedLayoutId])

  const resetToHome = useCallback(() => {
    setSelectedLayoutId('single')
    setSelectedFilterId('normal')
    setSelectedTemplateId(null)
    setFinalDataUrl(null)
    setCapturedImages([])
    setCaptureError(null)
    setScreen(SCREENS.HOME)
  }, [])

  // Changing the layout mid-flow invalidates any in-progress multi-shot
  // sequence (the slot count may no longer match what's already captured)
  // and any already-selected template (templates are sized per layout).
  function handleSelectLayout(layoutId) {
    setSelectedLayoutId(layoutId)
    setCapturedImages([])
    setSelectedTemplateId(null)
  }

  // Auto-reset the booth if a guest walks away mid-flow - not while on Home,
  // and not while Settings is open (someone's actively configuring it).
  const idleEnabled = screen !== SCREENS.HOME && !showSettings
  const { warning, dismissWarning } = useIdleReset({
    enabled: idleEnabled,
    timeoutMs: 45000,
    warnMs: 10000,
    onIdle: resetToHome,
  })

  async function handleCaptured(sourceCanvas, captureErr) {
    // captureFrame() in useCamera/safeCaptureFrame already validated the
    // video/canvas before this is called - if it still reports an error
    // (or somehow returns no canvas), surface that instead of touching
    // a null canvas.
    if (captureErr || !sourceCanvas) {
      setCaptureError(captureErr || createCaptureError(CAPTURE_ERROR_CODES.UNKNOWN_CAPTURE_ERROR, 'no canvas returned'))
      return
    }

    const totalSlots = selectedLayout.slots.length

    try {
      const filteredCanvas = applyCssFilter(sourceCanvas, selectedFilter.css)
      const updatedImages = [...capturedImages, filteredCanvas]

      logger.info('capture_completed', {
        layoutId: selectedLayout.id,
        slot: updatedImages.length,
        totalSlots,
      })

      if (updatedImages.length < totalSlots) {
        // More shots needed - stay on the Capture screen (camera stream
        // stays alive) and record this slot. A short pause here gives the
        // guest a breath between shots; the capture lock in
        // CameraCapture.jsx stays held for this whole async function, so
        // the shutter naturally stays disabled during the pause too.
        setCapturedImages(updatedImages)
        await new Promise((resolve) => setTimeout(resolve, 900))
        return
      }

      // Final shot - compose the full layout now.
      logger.info('image_processing_started', { layoutId: selectedLayout.id, slotCount: totalSlots })
      let templateImage = null
      if (selectedTemplate?.url) {
        templateImage = await loadImageFromUrl(selectedTemplate.url)
      }

      const composited = composeLayout({
        layout: selectedLayout,
        images: updatedImages,
        templateImage,
      })
      setFinalDataUrl(composited.toDataURL('image/png'))
      setCapturedImages([]) // sequence complete, ready for a fresh one next time
      logger.info('image_processing_completed', {})
      setScreen(SCREENS.REVIEW)
    } catch (err) {
      // compositeImage/composeLayout throw a categorized error already;
      // anything else (e.g. template image failed to load) gets wrapped.
      const categorized = err?.code ? err : createCaptureError(CAPTURE_ERROR_CODES.IMAGE_PROCESSING_ERROR, err?.message, err)
      logger.error('image_processing_failed', { code: categorized.code, message: categorized.technicalMessage })
      setCaptureError(categorized)
    }
  }

  function handlePrint() {
    // Opens the OS print dialog with the final image. This requires a
    // manual confirmation tap/click in the dialog on most browsers -
    // there is no way to bypass that from a web app.
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert(
        'Could not open the print window - your browser may have blocked the popup. Please allow popups for this site and try again.'
      )
      return
    }
    printWindow.document.write(
      `<html><head><title>Print</title><style>
        html,body{margin:0;padding:0;}
        img{width:100%;height:auto;display:block;}
        @media print { @page { margin: 0; } }
      </style></head><body>
        <img src="${finalDataUrl}" onload="window.print();" />
      </body></html>`
    )
    printWindow.document.close()
    setScreen(SCREENS.PRINT)
  }

  function handleDownload() {
    const a = document.createElement('a')
    a.href = finalDataUrl
    a.download = `photobooth-${Date.now()}.png`
    a.click()
  }

  return (
    <>
      {(() => {
        switch (screen) {
          case SCREENS.HOME:
            return (
              <HomeScreen onStart={() => setScreen(SCREENS.LAYOUT)} onOpenSettings={() => setShowSettings(true)} />
            )
          case SCREENS.LAYOUT:
            return (
              <LayoutPicker
                selectedId={selectedLayoutId}
                onSelect={handleSelectLayout}
                onNext={() => setScreen(SCREENS.TEMPLATE)}
                onBack={resetToHome}
              />
            )
          case SCREENS.TEMPLATE:
            return (
              <TemplatePicker
                templates={templates}
                setTemplates={setTemplates}
                selectedId={selectedTemplateId}
                onSelect={setSelectedTemplateId}
                onNext={() => setScreen(SCREENS.FILTER)}
                onBack={() => setScreen(SCREENS.LAYOUT)}
                layout={selectedLayout}
              />
            )
          case SCREENS.FILTER:
            return (
              <FilterPicker
                selectedId={selectedFilterId}
                onSelect={setSelectedFilterId}
                onNext={() => setScreen(SCREENS.CAPTURE)}
                onBack={() => setScreen(SCREENS.TEMPLATE)}
              />
            )
          case SCREENS.CAPTURE:
            return (
              <CameraCapture
                filterCss={selectedFilter.css}
                templateUrl={selectedTemplate?.url || null}
                onCaptured={handleCaptured}
                onBack={() => {
                  setCapturedImages([])
                  setScreen(SCREENS.FILTER)
                }}
                deviceId={cameraDeviceId}
                onDeviceChange={setCameraDeviceId}
                processingError={captureError}
                onDismissError={() => setCaptureError(null)}
                slotProgress={{ current: capturedImages.length + 1, total: selectedLayout.slots.length }}
              />
            )
          case SCREENS.REVIEW:
            return (
              <ReviewScreen
                dataUrl={finalDataUrl}
                onRetake={() => {
                  // Simple scope for now: retaking a multi-shot layout
                  // restarts the whole sequence rather than re-shooting a
                  // single slot.
                  setCapturedImages([])
                  setScreen(SCREENS.CAPTURE)
                }}
                onPrint={handlePrint}
                onDownload={handleDownload}
              />
            )
          case SCREENS.PRINT:
            return <PrintScreen onDone={resetToHome} />
          default:
            return null
        }
      })()}

      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
      {warning && <IdleWarning onStillHere={dismissWarning} />}
    </>
  )
}
