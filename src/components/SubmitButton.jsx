import Spinner from './Spinner'

/**
 * A submit button that shows a spinner and disables itself while pending.
 *
 * In Next.js this would use `useFormStatus()` — in Vite/React we pass
 * `pending` as a prop from the parent's own loading state instead.
 */
export default function SubmitButton({ children, className = '', pending = false, ...props }) {
  return (
    <button disabled={pending} type="submit" className={className} {...props}>
      {pending ? (
        <span className="inline-flex items-center gap-2">
          <Spinner /> {children}
        </span>
      ) : (
        children
      )}
    </button>
  )
}
