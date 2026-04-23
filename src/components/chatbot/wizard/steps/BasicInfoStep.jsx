import TextField from '../../../form/TextField'
import AdvancedOptionsSection from '../AdvancedOptionsSection'

export default function BasicInfoStep({
  name,
  onNameChange,
  companyName,
  onCompanyNameChange,
  agentName,
  onAgentNameChange,
  advancedOpen,
  onAdvancedOpenToggle,
  widgetTitle,
  onWidgetTitleChange,
  initialMessage,
  onInitialMessageChange,
  tone,
  onToneChange,
  templates,
  selectedTemplate,
  onTemplateChange,
  systemInstructions,
  onSystemInstructionsChange,
}) {
  return (
    <div className="mx-auto rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900">Basic Information</h2>
      <p className="mt-1 text-xs text-gray-500">Start with the essentials to get your chatbot up and running.</p>

      <div className="mt-4 space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-bold text-gray-800">
            Chatbot name <span className="text-red-500">*</span>
          </label>
          <TextField
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="e.g. Customer Support Bot"
            autoComplete="off"
          />
          <p className="mt-1 text-xs text-gray-500">No special characters; 3–40 characters long.</p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-bold text-gray-800">Company Name</label>
          <TextField
            value={companyName}
            onChange={(e) => onCompanyNameChange(e.target.value)}
            placeholder="eg. Customer Support"
            autoComplete="organization"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-bold text-gray-800">Agent Name</label>
          <TextField
            value={agentName}
            onChange={(e) => onAgentNameChange(e.target.value)}
            placeholder="eg. Customer Support"
            autoComplete="off"
          />
        </div>

        <AdvancedOptionsSection
          open={advancedOpen}
          onToggle={onAdvancedOpenToggle}
          widgetTitle={widgetTitle}
          onWidgetTitleChange={onWidgetTitleChange}
          initialMessage={initialMessage}
          onInitialMessageChange={onInitialMessageChange}
          tone={tone}
          onToneChange={onToneChange}
          templates={templates}
          selectedTemplate={selectedTemplate}
          onTemplateChange={onTemplateChange}
          systemInstructions={systemInstructions}
          onSystemInstructionsChange={onSystemInstructionsChange}
        />
      </div>
    </div>
  )
}
