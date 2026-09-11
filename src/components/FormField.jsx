export default function FormField({
  id,
  label,
  type = 'text',
  className = '',
  ...props
}) {
  const isTextarea = type === 'textarea'
  const Tag = isTextarea ? 'textarea' : 'input'

  return (
    <div className="flex flex-col gap-1">
      <Tag
        id={id}
        name={id}
        {...(!isTextarea && { type })}
        required
        placeholder={label}
        className={`border border-border px-3 py-2 text-sm sm:text-base ${className}`}
        {...props}
      />
    </div>
  )
}
