import { useEffect, useId, useRef } from 'react'
import '../styles/ConfirmationDialog.css'

function ConfirmationDialog({
    open,
    title = 'Confirm action',
    message = '',
    children = null,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
    isBusy = false,
    variant = 'default',
    role = 'alertdialog',
    closeOnBackdrop = true,
    initialFocus = 'cancel'
}) {
    const dialogRef = useRef(null)
    const cancelButtonRef = useRef(null)
    const confirmButtonRef = useRef(null)
    const previousFocusRef = useRef(null)

    const titleId = useId()
    const descriptionId = useId()

    useEffect(() => {
        if (open) {
            previousFocusRef.current = document.activeElement

            const focusTarget =
                initialFocus === 'confirm' ? confirmButtonRef.current : cancelButtonRef.current

            focusTarget?.focus()
            return
        }

        previousFocusRef.current?.focus?.()
    }, [open, initialFocus])

    useEffect(() => {
        if (!open) return

        function handleKeyDown(event) {
            if (event.key === 'Escape') {
                if (!isBusy) {
                    onCancel?.()
                }
                return
            }

            if (event.key !== 'Tab') return

            const focusable = dialogRef.current?.querySelectorAll(
                'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
            )

            if (!focusable || focusable.length === 0) return

            const firstElement = focusable[0]
            const lastElement = focusable[focusable.length - 1]

            if (event.shiftKey) {
                if (document.activeElement === firstElement) {
                    event.preventDefault()
                    lastElement.focus()
                }
            } else if (document.activeElement === lastElement) {
                event.preventDefault()
                firstElement.focus()
            }
        }

        document.addEventListener('keydown', handleKeyDown)

        return () => {
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [open, isBusy, onCancel])

    if (!open) return null

    const confirmButtonClassName = [
        'confirmation-dialog__button',
        variant === 'danger'
            ? 'confirmation-dialog__button--danger'
            : 'confirmation-dialog__button--primary'
    ].join(' ')

    function handleBackdropClick() {
        if (isBusy) return
        if (!closeOnBackdrop) return
        onCancel?.()
    }

    return (
        <div className="confirmation-dialog__backdrop" onClick={handleBackdropClick}>
            <div
                ref={dialogRef}
                className="confirmation-dialog"
                role={role}
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={descriptionId}
                tabIndex={-1}
                onClick={(event) => event.stopPropagation()}
            >
                <h3 id={titleId} className="confirmation-dialog__title">
                    {title}
                </h3>

                <div id={descriptionId} className="confirmation-dialog__body">
                    {message ? <p className="confirmation-dialog__text">{message}</p> : null}
                    {children}
                </div>

                <div className="confirmation-dialog__actions">
                    <button
                        ref={cancelButtonRef}
                        type="button"
                        className="confirmation-dialog__button confirmation-dialog__button--secondary"
                        onClick={onCancel}
                        disabled={isBusy}
                    >
                        {cancelText}
                    </button>

                    <button
                        ref={confirmButtonRef}
                        type="button"
                        className={confirmButtonClassName}
                        onClick={onConfirm}
                        disabled={isBusy}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ConfirmationDialog