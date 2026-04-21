"use client";

import { useState } from "react";
import {
  Button,
  Input,
  Textarea,
  Label,
  Checkbox,
  FormField,
  ListDropdown,
  ModalRoot,
  ModalTrigger,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalClose,
  useModalContext,
  COLORS,
} from "@/components/ui";
import { RESTRICTION_OPTIONS } from "@/components/chatbots/types";

export type GuardrailRow = {
  id: string;
  name: string;
  linkedChatbot: string;
  status: "active" | "inactive";
  lastUpdated: string;
  restrictions?: Record<string, boolean>;
  customRestriction?: string;
};

function formatDate() {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

interface CreateGuardrailFormProps {
  onCreate: (guardrail: Omit<GuardrailRow, "id">) => void;
}

function CreateGuardrailForm({ onCreate }: CreateGuardrailFormProps) {
  const { close } = useModalContext();
  const [name, setName] = useState("");
  const [applyTo, setApplyTo] = useState("all");
  const [restrictions, setRestrictions] = useState<Record<string, boolean>>({});
  const [customRestriction, setCustomRestriction] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");

  const toggleRestriction = (key: string) => {
    setRestrictions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const linkedChatbot = applyTo === "all" ? "All chatbots" : applyTo;
    onCreate({
      name: name.trim() || "Guardrail name",
      linkedChatbot,
      status,
      lastUpdated: formatDate(),
      restrictions: { ...restrictions },
      customRestriction: customRestriction.trim(),
    });
    close();
    setName("");
    setRestrictions({});
    setCustomRestriction("");
    setStatus("active");
    setApplyTo("all");
  };

  return (
    <>
      <div className="flex items-start justify-between border-b border-gray-200 ">
        <ModalHeader className=" mb-0 p-4">
          <h2 className="text-medium font-bold text-gray-900">Create a Guardrail</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Define rules that limit or guide how the chatbot responds.
          </p>
        </ModalHeader>
        <ModalClose className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700" aria-label="Close">
          <span className="inline-block h-5 w-5" data-icon="close">×</span>
        </ModalClose>
      </div>

      <form onSubmit={handleSubmit} >
        <div className="space-y-4 p-4">
          <FormField
            id="guardrail-name"
            label="Name"
            required
            helperText="A short, descriptive name for this guardrail."
          >
            <Input
              id="guardrail-name"
              placeholder="e.g. Customer Support Restrictions"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg border-gray-200 bg-white"
            />
          </FormField>

          <FormField
            id="apply-to"
            label="Apply to"
            helperText="Choose where this guardrail will be enforced."
          >
            <ListDropdown
              id="apply-to"
              value={applyTo}
              onChange={setApplyTo}
              options={[{ value: "all", label: "All chatbots" }]}
              className="rounded-lg border-gray-200 bg-white"
            />
          </FormField>

          <div className="space-y-2">
            <Label className="block text-sm font-bold text-gray-900">Restrictions</Label>
            <p className="text-sm text-gray-500">Select what the chatbot must not do.</p>
            <div className="space-y-2 pt-1">
              {RESTRICTION_OPTIONS.map((opt) => (
                <label key={opt} className="flex cursor-pointer items-center gap-3">
                  <Checkbox
                    checked={restrictions[opt] ?? false}
                    onChange={() => toggleRestriction(opt)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600"
                  />
                  <span className="text-sm text-gray-900">{opt}</span>
                </label>
              ))}
            </div>
            <Textarea
              placeholder="Describe a custom restriction..."
              value={customRestriction}
              onChange={(e) => setCustomRestriction(e.target.value)}
              rows={3}
              className="mt-2 min-h-[80px] rounded-lg border-gray-200 bg-white"
            />
            <p className="text-sm text-gray-500">At least one restriction is required.</p>
          </div>

          <FormField
            id="guardrail-status"
            label="Status"
            helperText="Guardrails only apply when active."
          >
            <ListDropdown
              id="guardrail-status"
              value={status}
              onChange={(v) => setStatus(v as "active" | "inactive")}
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
              className="rounded-lg border-gray-200 bg-white"
            />
          </FormField>
        </div>

        <ModalFooter className="mt-0 gap-2 border-t border-gray-200 pt-6 p-4 w-full " style={{width: "100%"}}>
          <ModalClose asChild className="w-full" >
            <Button
              type="button"
              variant="outline"
              className="rounded-lg w-full font-semibold "
              style={{ borderColor: COLORS.BRAND_BORDER, color: COLORS.BRAND_TITLE,  }}
            >
              Cancel
            </Button>
          </ModalClose>
          <Button
            type="submit"
            className="rounded-lg text-white w-full"
            style={{ backgroundColor: COLORS.BRAND }}
          >
            Create Guardrail
          </Button>
        </ModalFooter>
      </form>
    </>
  );
}

interface CreateGuardrailModalProps {
  onCreate: (guardrail: Omit<GuardrailRow, "id">) => void;
  children: React.ReactNode;
}

export function CreateGuardrailModal({ onCreate, children }: CreateGuardrailModalProps) {
  return (
    <ModalRoot>
      <ModalTrigger asChild>{children}</ModalTrigger>
      <ModalContent className="max-w-lg" guardrail >
        <CreateGuardrailForm onCreate={onCreate} />
      </ModalContent>
    </ModalRoot>
  );
}

interface EditGuardrailFormProps {
  guardrail: GuardrailRow;
  onSave: (guardrail: GuardrailRow) => void;
  onClose: () => void;
}

function EditGuardrailForm({ guardrail, onSave, onClose }: EditGuardrailFormProps) {
  const [name, setName] = useState(guardrail.name);
  const [applyTo, setApplyTo] = useState(guardrail.linkedChatbot === "All chatbots" ? "all" : guardrail.linkedChatbot);
  const [restrictions, setRestrictions] = useState<Record<string, boolean>>(guardrail.restrictions ?? {});
  const [customRestriction, setCustomRestriction] = useState(guardrail.customRestriction ?? "");
  const [status, setStatus] = useState<"active" | "inactive">(guardrail.status);

  const toggleRestriction = (key: string) => {
    setRestrictions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const linkedChatbot = applyTo === "all" ? "All chatbots" : applyTo;
    onSave({
      ...guardrail,
      name: name.trim() || guardrail.name,
      linkedChatbot,
      status,
      lastUpdated: formatDate(),
      restrictions: { ...restrictions },
      customRestriction: customRestriction.trim(),
    });
    onClose();
  };

  return (
    <>
      <div className="flex items-start justify-between border-b border-gray-200 ">
        <ModalHeader className=" mb-0 p-4">
          <h2 className="text-medium font-bold text-gray-900">Edit guardrail</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Update rules that limit or guide how the chatbot responds.
          </p>
        </ModalHeader>
        <ModalClose onClick={onClose} className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700" aria-label="Close">
          <span className="inline-block h-5 w-5" data-icon="close">×</span>
        </ModalClose>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-4 p-4">
          <FormField
            id="edit-guardrail-name"
            label="Name"
            required
            helperText="A short, descriptive name for this guardrail."
          >
            <Input
              id="edit-guardrail-name"
              placeholder="e.g. Customer Support Restrictions"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg border-gray-200 bg-white"
            />
          </FormField>

          <FormField
            id="edit-apply-to"
            label="Apply to"
            helperText="Choose where this guardrail will be enforced."
          >
            <ListDropdown
              id="edit-apply-to"
              value={applyTo}
              onChange={setApplyTo}
              options={[{ value: "all", label: "All chatbots" }]}
              className="rounded-lg border-gray-200 bg-white"
            />
          </FormField>

          <div className="space-y-2">
            <Label className="block text-sm font-bold text-gray-900">Restrictions</Label>
            <p className="text-sm text-gray-500">Select what the chatbot must not do.</p>
            <div className="space-y-2 pt-1">
              {RESTRICTION_OPTIONS.map((opt) => (
                <label key={opt} className="flex cursor-pointer items-center gap-3">
                  <Checkbox
                    checked={restrictions[opt] ?? false}
                    onChange={() => toggleRestriction(opt)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600"
                  />
                  <span className="text-sm text-gray-900">{opt}</span>
                </label>
              ))}
            </div>
            <Textarea
              placeholder="Describe a custom restriction..."
              value={customRestriction}
              onChange={(e) => setCustomRestriction(e.target.value)}
              rows={3}
              className="mt-2 min-h-[80px] rounded-lg border-gray-200 bg-white"
            />
            <p className="text-sm text-gray-500">At least one restriction is required.</p>
          </div>

          <FormField
            id="edit-guardrail-status"
            label="Status"
            helperText="Guardrails only apply when active."
          >
            <ListDropdown
              id="edit-guardrail-status"
              value={status}
              onChange={(v) => setStatus(v as "active" | "inactive")}
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
              className="rounded-lg border-gray-200 bg-white"
            />
          </FormField>
        </div>

        <ModalFooter className="mt-0 gap-2 border-t border-gray-200 pt-6 p-4 w-full " style={{ width: "100%" }}>
          <Button
            type="button"
            variant="outline"
            className="rounded-lg w-full font-semibold"
            style={{ borderColor: COLORS.BRAND_BORDER, color: COLORS.BRAND_TITLE }}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="rounded-lg text-white w-full"
            style={{ backgroundColor: COLORS.BRAND }}
          >
            Save
          </Button>
        </ModalFooter>
      </form>
    </>
  );
}

export interface EditGuardrailModalProps {
  open: boolean;
  onClose: () => void;
  guardrail: GuardrailRow | null;
  onSave: (guardrail: GuardrailRow) => void;
}

export function EditGuardrailModal({ open, onClose, guardrail, onSave }: EditGuardrailModalProps) {
  if (!open || !guardrail) return null;
  return (
    <ModalRoot defaultOpen={true} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <ModalContent className="max-w-lg" guardrail>
        <EditGuardrailForm guardrail={guardrail} onSave={onSave} onClose={onClose} />
      </ModalContent>
    </ModalRoot>
  );
}
