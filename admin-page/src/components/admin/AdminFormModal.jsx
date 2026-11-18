import React, { useEffect, useRef } from 'react'
import { AdminModal, AdminInput, AdminTextarea, AdminSelect, AdminButton, FormRow, FormSection, AdminCheckbox } from './AdminForm'
import { X } from 'lucide-react'

export function AdminFormModal({
  isOpen,
  onClose,
  title,
  sections = [],
  initialData = {},
  onSubmit,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  size = 'lg',
  loading = false,
  dirty = false,
  showClose = true,
}) {
  const formRef = useRef(null)
  const firstInputRef = useRef(null)

  // Focus first input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => firstInputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Handle Escape key
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && isOpen) {
        if (dirty) {
          if (window.confirm('You have unsaved changes. Close anyway?')) {
            onClose()
          }
        } else {
          onClose()
        }
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, dirty, onClose])

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = Object.fromEntries(formData.entries())
    // Convert checkboxes
    sections.forEach(section => {
      if (section.fields) {
        section.fields.forEach(field => {
          if (field.type === 'checkbox') {
            data[field.name] = formData.has(field.name)
          }
          // Chips and multi-selects post one hidden input per chosen value.
          if (field.type === 'chips' || field.type === 'multiselect') {
            data[field.name] = formData.getAll(field.name)
          }
        })
      }
    })
    onSubmit?.(data)
  }

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size={size}
      showClose={showClose}
    >
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        {sections.map((section, sectionIndex) => (
          <React.Fragment key={sectionIndex}>
            {section.title && (
              <FormSection title={section.title} description={section.description}>
                {section.fields?.map((field, fieldIndex) => (
                  <React.Fragment key={`${sectionIndex}-${fieldIndex}`}>
                    {field.type === 'text' && (
                      <AdminInput
                        ref={fieldIndex === 0 && sectionIndex === 0 ? firstInputRef : null}
                        name={field.name}
                        label={field.label}
                        type={field.inputType || 'text'}
                        defaultValue={initialData[field.name] || field.defaultValue || ''}
                        placeholder={field.placeholder}
                        required={field.required}
                        error={field.error}
                        hint={field.hint}
                        disabled={field.disabled}
                        className={field.className}
                      />
                    )}
                    {field.type === 'textarea' && (
                      <AdminTextarea
                        name={field.name}
                        label={field.label}
                        defaultValue={initialData[field.name] || field.defaultValue || ''}
                        placeholder={field.placeholder}
                        required={field.required}
                        rows={field.rows || 4}
                        error={field.error}
                        hint={field.hint}
                      />
                    )}
                    {field.type === 'select' && (
                      <AdminSelect
                        name={field.name}
                        label={field.label}
                        options={field.options || []}
                        defaultValue={initialData[field.name] || field.defaultValue || ''}
                        placeholder={field.placeholder}
                        required={field.required}
                        error={field.error}
                        hint={field.hint}
                      />
                    )}
                    {field.type === 'checkbox' && (
                      <AdminCheckbox
                        name={field.name}
                        label={field.label}
                        defaultChecked={initialData[field.name] || field.defaultValue || false}
                      />
                    )}
                    {field.type === 'date' && (
                      <AdminInput
                        name={field.name}
                        type="date"
                        label={field.label}
                        defaultValue={initialData[field.name] || field.defaultValue || ''}
                        required={field.required}
                        error={field.error}
                      />
                    )}
                    {field.type === 'number' && (
                      <AdminInput
                        name={field.name}
                        type="number"
                        label={field.label}
                        defaultValue={initialData[field.name] || field.defaultValue || ''}
                        min={field.min}
                        max={field.max}
                        step={field.step}
                        required={field.required}
                        error={field.error}
                        hint={field.hint}
                      />
                    )}
                    {field.type === 'email' && (
                      <AdminInput
                        name={field.name}
                        type="email"
                        label={field.label}
                        defaultValue={initialData[field.name] || field.defaultValue || ''}
                        required={field.required}
                        error={field.error}
                        hint={field.hint}
                      />
                    )}
                    {field.type === 'file' && (
                      <div className="admin-form-group">
                        {field.label && <label className="admin-label">{field.label}</label>}
                        <input
                          name={field.name}
                          type="file"
                          accept={field.accept}
                          onChange={field.onChange}
                          className="admin-input"
                          required={field.required}
                        />
                        {field.hint && <p className="text-sm text-admin-500 mt-1">{field.hint}</p>}
                      </div>
                    )}
                    {field.type === 'multiselect' && (
                      <div className="admin-form-group">
                        {field.label && <label className="admin-label">{field.label}</label>}
                        <AdminMultiSelectField
                          name={field.name}
                          options={field.options || []}
                          value={initialData[field.name] || field.defaultValue || []}
                          onChange={field.onChange}
                          placeholder={field.placeholder}
                        />
                      </div>
                    )}
                    {field.type === 'chips' && (
                      <AdminChipsField
                        name={field.name}
                        options={field.options || []}
                        value={initialData[field.name] || field.defaultValue || []}
                        onChange={field.onChange}
                        label={field.label}
                        description={field.description}
                      />
                    )}
                    {field.type === 'custom' && field.render && field.render()}
                  </React.Fragment>
                ))}
              </FormSection>
            )}
            {!section.title && section.fields && (
              <div className="space-y-4">
                {section.fields.map((field, fieldIndex) => (
                  <React.Fragment key={`${sectionIndex}-${fieldIndex}`}>
                    {field.type === 'text' && (
                      <AdminInput
                        ref={fieldIndex === 0 && sectionIndex === 0 ? firstInputRef : null}
                        name={field.name}
                        label={field.label}
                        type={field.inputType || 'text'}
                        defaultValue={initialData[field.name] || field.defaultValue || ''}
                        placeholder={field.placeholder}
                        required={field.required}
                        error={field.error}
                        hint={field.hint}
                        disabled={field.disabled}
                        className={field.className}
                      />
                    )}
                    {field.type === 'textarea' && (
                      <AdminTextarea
                        name={field.name}
                        label={field.label}
                        defaultValue={initialData[field.name] || field.defaultValue || ''}
                        placeholder={field.placeholder}
                        required={field.required}
                        rows={field.rows || 4}
                        error={field.error}
                        hint={field.hint}
                      />
                    )}
                    {field.type === 'select' && (
                      <AdminSelect
                        name={field.name}
                        label={field.label}
                        options={field.options || []}
                        defaultValue={initialData[field.name] || field.defaultValue || ''}
                        placeholder={field.placeholder}
                        required={field.required}
                        error={field.error}
                        hint={field.hint}
                      />
                    )}
                    {field.type === 'checkbox' && (
                      <AdminCheckbox
                        name={field.name}
                        label={field.label}
                        defaultChecked={initialData[field.name] || field.defaultValue || false}
                      />
                    )}
                    {field.type === 'date' && (
                      <AdminInput
                        name={field.name}
                        type="date"
                        label={field.label}
                        defaultValue={initialData[field.name] || field.defaultValue || ''}
                        required={field.required}
                        error={field.error}
                      />
                    )}
                    {field.type === 'number' && (
                      <AdminInput
                        name={field.name}
                        type="number"
                        label={field.label}
                        defaultValue={initialData[field.name] || field.defaultValue || ''}
                        min={field.min}
                        max={field.max}
                        step={field.step}
                        required={field.required}
                        error={field.error}
                        hint={field.hint}
                      />
                    )}
                    {field.type === 'email' && (
                      <AdminInput
                        name={field.name}
                        type="email"
                        label={field.label}
                        defaultValue={initialData[field.name] || field.defaultValue || ''}
                        required={field.required}
                        error={field.error}
                        hint={field.hint}
                      />
                    )}
                    {field.type === 'file' && (
                      <div className="admin-form-group">
                        {field.label && <label className="admin-label">{field.label}</label>}
                        <input
                          name={field.name}
                          type="file"
                          accept={field.accept}
                          onChange={field.onChange}
                          className="admin-input"
                          required={field.required}
                        />
                        {field.hint && <p className="text-sm text-admin-500 mt-1">{field.hint}</p>}
                      </div>
                    )}
                    {field.type === 'multiselect' && (
                      <div className="admin-form-group">
                        {field.label && <label className="admin-label">{field.label}</label>}
                        <AdminMultiSelectField
                          name={field.name}
                          options={field.options || []}
                          value={initialData[field.name] || field.defaultValue || []}
                          onChange={field.onChange}
                          placeholder={field.placeholder}
                        />
                      </div>
                    )}
                    {field.type === 'chips' && (
                      <AdminChipsField
                        name={field.name}
                        options={field.options || []}
                        value={initialData[field.name] || field.defaultValue || []}
                        onChange={field.onChange}
                        label={field.label}
                        description={field.description}
                      />
                    )}
                    {field.type === 'custom' && field.render && field.render()}
                  </React.Fragment>
                ))}
              </div>
            )}
          </React.Fragment>
        ))}

        <div className="admin-modal-footer pt-4 border-t border-admin-100">
          <AdminButton variant="ghost" type="button" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </AdminButton>
          <AdminButton variant="primary" type="submit" loading={loading}>
            {submitLabel}
          </AdminButton>
        </div>
      </form>
    </AdminModal>
  )
}

// Chosen values for chips and multi-selects. The field keeps its own list (the modal's other fields are
// uncontrolled too), tells an optional onChange, and posts one hidden input per value so submit sees them.
function useChosen(initial, onChange) {
  const [chosen, setChosen] = React.useState(() => (Array.isArray(initial) ? initial : []))
  const set = (next) => { setChosen(next); onChange?.(next) }
  const toggle = (v) => set(chosen.includes(v) ? chosen.filter((x) => x !== v) : [...chosen, v])
  return { chosen, toggle }
}

// Multi-select field component
function AdminMultiSelectField({ name, options = [], value: initial = [], onChange, placeholder }) {
  const { chosen: value, toggle } = useChosen(initial, onChange)
  const [open, setOpen] = React.useState(false)
  const buttonRef = React.useRef(null)

  React.useEffect(() => {
    function handleClickOutside(e) {
      if (buttonRef.current && !buttonRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={buttonRef}>
      {value.map((v) => <input key={v} type="hidden" name={name} value={v} />)}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="admin-input flex items-center justify-between h-10"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">
          {value.length === 0
            ? <span className="text-admin-400">{placeholder || 'Select...'}</span>
            : value.length === 1
            ? options.find(o => o.value === value[0])?.label || value[0]
            : `${value.length} selected`}
        </span>
        <svg className={`w-4 h-4 text-admin-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-admin-200 rounded-lg shadow-lg admin-scrollbar-thin max-h-48 overflow-auto">
          {options.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2 px-3 py-2 hover:bg-admin-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={value.includes(opt.value)}
                onChange={() => toggle(opt.value)}
                className="w-4 h-4 rounded border-admin-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-admin-700">{opt.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

// Chips field component (for branch/skill selection)
function AdminChipsField({ name, options = [], value: initial = [], onChange, label, description }) {
  const { chosen: value, toggle } = useChosen(initial, onChange)
  return (
    <div className="admin-form-group">
      {label && <label className="admin-label">{label}</label>}
      {value.map((v) => <input key={v} type="hidden" name={name} value={v} />)}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            aria-pressed={value.includes(opt.value)}
            onClick={() => toggle(opt.value)}
            className={`px-3 py-1.5 text-sm rounded border transition-colors ${
              value.includes(opt.value)
                ? 'bg-primary-50 border-primary-300 text-primary-700'
                : 'bg-white border-admin-300 text-admin-600 hover:bg-admin-50'
            }`}
          >
            {opt.label || opt.value}
          </button>
        ))}
      </div>
      {description && <p className="text-sm text-admin-500 mt-1">{description}</p>}
    </div>
  )
}