"use client";

import { useActionState } from "react";
import { createProjectAction } from "./actions";
import { FileUpload } from "@/ui/file-upload";
import { Modal } from "@/ui/modal";

export default function NewProjectForm() {
  const [state, action, pending] = useActionState<{ error?: string }, FormData>(
    createProjectAction,
    {},
  );
  return (
    <Modal
      title="New project"
      trigger={
        <button type="button" className="constra-btn-primary">
          + New project
        </button>
      }
    >
      <form action={action} className="flex flex-col gap-3">
        <input
          name="name"
          required
          maxLength={200}
          placeholder="Project name — e.g. Villa, Palm Jumeirah"
          className="constra-input"
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            name="clientName"
            maxLength={200}
            placeholder="Client name"
            className="constra-input"
          />
          <input
            name="location"
            maxLength={300}
            placeholder="Location — e.g. Dubai"
            className="constra-input"
          />
        </div>
        <input
          name="agreementAmount"
          inputMode="decimal"
          placeholder="Agreement amount (AED)"
          className="constra-input"
        />
        <textarea
          name="stages"
          rows={4}
          placeholder={"Stages, one per line:\nFoundation\nStructure\nMEP\nFinishing"}
          className="constra-input"
        />
        <div>
          <p className="mb-1 text-sm font-medium">Site photos / drawings</p>
          <FileUpload name="attachments" />
        </div>
        {state?.error && (
          <p role="alert" className="text-sm text-red-600">
            {state.error}
          </p>
        )}
        <button disabled={pending} className="constra-btn-primary w-full">
          {pending ? "Creating…" : "Create project"}
        </button>
      </form>
    </Modal>
  );
}
