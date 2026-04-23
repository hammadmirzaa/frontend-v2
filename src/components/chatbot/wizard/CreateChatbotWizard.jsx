import WizardStepper from './WizardStepper'
import WizardHeader from './WizardHeader'
import WizardFooter from './WizardFooter'
import BasicInfoStep from './steps/BasicInfoStep'
import GuardrailsStep from './steps/GuardrailsStep'
import KnowledgeStep from './steps/KnowledgeStep'
import PreviewStep from './steps/PreviewStep'
import { STEPS } from './wizardConstants'
import { useCreateChatbotWizard } from './useCreateChatbotWizard'

export default function CreateChatbotWizard({ onCancel, onComplete, showToast }) {
  const w = useCreateChatbotWizard(showToast)

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#FAFBFC] p-6">
      <WizardHeader onClose={onCancel} busy={w.busy} />

      <div className="shrink-0 px-4 py-6">
        <WizardStepper steps={STEPS} currentIndex={w.step} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-6 ">
        {w.step === 0 && (
          <BasicInfoStep
            name={w.basic.name}
            onNameChange={w.basic.setName}
            companyName={w.basic.companyName}
            onCompanyNameChange={w.basic.setCompanyName}
            agentName={w.basic.agentName}
            onAgentNameChange={w.basic.setAgentName}
            advancedOpen={w.basic.advancedOpen}
            onAdvancedOpenToggle={() => w.basic.setAdvancedOpen((o) => !o)}
            widgetTitle={w.basic.widgetTitle}
            onWidgetTitleChange={w.basic.setWidgetTitle}
            initialMessage={w.basic.initialMessage}
            onInitialMessageChange={w.basic.setInitialMessage}
            tone={w.basic.tone}
            onToneChange={w.basic.setTone}
            templates={w.basic.templates}
            selectedTemplate={w.basic.selectedTemplate}
            onTemplateChange={w.basic.handleTemplateChange}
            systemInstructions={w.basic.systemInstructions}
            onSystemInstructionsChange={w.basic.setSystemInstructions}
          />
        )}
        {w.step === 1 && (
          <GuardrailsStep
            guardrailName={w.guardrails.guardrailName}
            onGuardrailNameChange={w.guardrails.setGuardrailName}
            restrictPii={w.guardrails.restrictPii}
            setRestrictPii={w.guardrails.setRestrictPii}
            restrictFinancial={w.guardrails.restrictFinancial}
            setRestrictFinancial={w.guardrails.setRestrictFinancial}
            restrictMedical={w.guardrails.restrictMedical}
            setRestrictMedical={w.guardrails.setRestrictMedical}
            restrictLegal={w.guardrails.restrictLegal}
            setRestrictLegal={w.guardrails.setRestrictLegal}
            customRestrictionLines={w.guardrails.customRestrictionLines}
            onAddCustomRestriction={w.guardrails.addCustomRestrictionLine}
            onRemoveCustomRestriction={w.guardrails.removeCustomRestrictionLine}
          />
        )}
        {w.step === 2 && (
          <KnowledgeStep
            fileInputRef={w.fileInputRef}
            uploadedFiles={w.knowledge.uploadedFiles}
            onFileInputClick={() => w.fileInputRef.current?.click()}
            onFilePick={w.knowledge.onFilePick}
            onDropZoneDrop={w.knowledge.onDropZoneDrop}
            onRemoveFile={w.knowledge.removeFile}
            websiteUrl={w.knowledge.websiteUrl}
            onWebsiteUrlChange={w.knowledge.setWebsiteUrl}
            manualKbOpen={w.knowledge.manualKbOpen}
            onManualKbToggle={() => w.knowledge.setManualKbOpen((o) => !o)}
            manualKbText={w.knowledge.manualKbText}
            onManualKbTextChange={w.knowledge.setManualKbText}
          />
        )}
        {w.step === 3 && (
          <PreviewStep
            widgetTitle={w.basic.widgetTitle}
            initialMessage={w.basic.initialMessage}
            embedCode={w.embedCode}
            copied={w.copied}
            onCopy={w.handleCopy}
          />
        )}
      </div>

      <WizardFooter
        step={w.step}
        busy={w.busy}
        showSkip={w.showSkip}
        onCancel={onCancel}
        onBack={w.handleBack}
        onSkip={w.handleSkip}
        onNext={w.handleNext}
        onActivate={() => w.chatbotId && onComplete(w.chatbotId)}
        canActivate={Boolean(w.chatbotId)}
      />
    </div>
  )
}
