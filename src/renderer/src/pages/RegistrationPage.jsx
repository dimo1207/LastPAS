import { useEffect, useMemo, useRef, useState } from 'react'
import '../styles/RegistrationPage.css'

function RegistrationPage({ onNavigateMenu, onRegistrationComplete }) {
    const [participantLabel, setParticipantLabel] = useState('')
    const [message, setMessage] = useState('')
    const [showConfirmModal, setShowConfirmModal] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const trimmedLabel = useMemo(() => participantLabel.trim(), [participantLabel])

    const beginButtonRef = useRef(null)
    const cancelButtonRef = useRef(null)
    const modalRef = useRef(null)
    const previousFocusRef = useRef(null)
    const textInputRef = useRef(null);

    useEffect(() => {
        textInputRef.current?.focus();
    }, []);

    useEffect(() => {
        if (showConfirmModal) {
            previousFocusRef.current = document.activeElement
            cancelButtonRef.current?.focus()
            return
        }

        previousFocusRef.current?.focus?.()
    }, [showConfirmModal])

    useEffect(() => {
        if (!showConfirmModal) return

        function handleKeyDown(event) {
            if (event.key === 'Escape') {
                if (!isSubmitting) {
                    setShowConfirmModal(false)
                }
                return
            }

            if (event.key !== 'Tab') return

            const focusable = modalRef.current?.querySelectorAll(
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
            } else {
                if (document.activeElement === lastElement) {
                    event.preventDefault()
                    firstElement.focus()
                }
            }
        }

        document.addEventListener('keydown', handleKeyDown)

        return () => {
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [showConfirmModal, isSubmitting])

    function handleSubmit(event) {
        event.preventDefault()

        if (!trimmedLabel) {
            setMessage('Please enter a participant label.')
            return
        }

        setMessage('')
        setShowConfirmModal(true)
    }

    function handleCancelConfirmation() {
        if (isSubmitting) return
        setShowConfirmModal(false)
    }

    async function handleConfirmCreateSession() {
        if (!trimmedLabel) {
            setShowConfirmModal(false)
            setMessage('Please enter a participant label.')
            return
        }

        setIsSubmitting(true)

        try {
            const result = await window.api?.createSession?.({
                participantLabel: trimmedLabel
            })

            if (result?.ok && result?.session) {
                setShowConfirmModal(false)
                setMessage('')
                onRegistrationComplete?.(result.session)
                return
            }

            setShowConfirmModal(false)
            setMessage('Something went wrong while creating the session.')
        } catch (err) {
            setShowConfirmModal(false)
            setMessage('Something went wrong while creating the session.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="registration-page">
            <div className="registration-page__topbar">
                <button
                    type="button"
                    className="registration-page__back"
                    onClick={onNavigateMenu}
                    disabled={isSubmitting}
                >
                    <span className="registration-page__back-icon" aria-hidden="true">
                        ←
                    </span>
                    <span>Return to Menu</span>
                </button>
            </div>

            <header className="registration-page__header">
                <h1 className="registration-page__title">Registration</h1>
                <div className="registration-page__rule" />
                <p className="registration-page__subtitle">
                    Start a new administration by entering a participant label.
                </p>
            </header>

            <main className="registration-page__panel">
                <div className="registration-page__panel-title-row">
                    <h2 className="registration-page__panel-title">Participant Information</h2>
                </div>

                <div className="registration-page__panel-rule" />

                <form className="registration-page__form" onSubmit={handleSubmit}>
                    <div className="registration-page__field">
                        <label htmlFor="participantLabel" className="registration-page__label">
                            Participant Label
                        </label>

                        <input
                            ref={textInputRef}
                            id="participantLabel"
                            name="participantLabel"
                            type="text"
                            className="registration-page__input"
                            value={participantLabel}
                            onChange={(event) => {
                                setParticipantLabel(event.target.value)
                                setMessage('')
                            }}
                            placeholder="Enter name or ID"
                            autoComplete="off"
                            disabled={isSubmitting}
                        />
                    </div>

                    {message && <div className="registration-page__message">{message}</div>}

                    <div className="registration-page__actions">
                        <button
                            ref={beginButtonRef}
                            type="submit"
                            className="registration-page__submit"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Creating...' : 'Begin'}
                        </button>
                    </div>
                </form>
            </main>

            {showConfirmModal && (
                <div
                    className="registration-page__modal-backdrop"
                    onClick={handleCancelConfirmation}
                >
                    <div
                        ref={modalRef}
                        className="registration-page__modal"
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="registration-confirm-title"
                        aria-describedby="registration-confirm-text"
                        tabIndex={-1}
                        onClick={(event) => event.stopPropagation()}
                    >
                        <h3 id="registration-confirm-title" className="registration-page__modal-title">
                            Create New Session
                        </h3>

                        <p id="registration-confirm-text" className="registration-page__modal-text">
                            Start a new administration for <strong>{trimmedLabel}</strong>?
                        </p>

                        <div className="registration-page__modal-actions">
                            <button
                                ref={cancelButtonRef}
                                type="button"
                                className="registration-page__modal-button registration-page__modal-button--secondary"
                                onClick={handleCancelConfirmation}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="registration-page__modal-button registration-page__modal-button--primary"
                                onClick={handleConfirmCreateSession}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Creating...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default RegistrationPage