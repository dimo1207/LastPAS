import { useEffect, useMemo, useRef, useState } from 'react'
import ConfirmationDialog from '../components/ConfirmationDialog'
import '../styles/RegistrationPage.css'

function RegistrationPage({ onNavigateMenu, onRegistrationComplete }) {
    const [participantLabel, setParticipantLabel] = useState('')
    const [message, setMessage] = useState('')
    const [showConfirmModal, setShowConfirmModal] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const trimmedLabel = useMemo(() => participantLabel.trim(), [participantLabel])

    const textInputRef = useRef(null)

    useEffect(() => {
        textInputRef.current?.focus()
    }, [])

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
                            type="submit"
                            className="registration-page__submit"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Creating...' : 'Begin'}
                        </button>
                    </div>
                </form>
            </main>

            <ConfirmationDialog
                open={showConfirmModal}
                title="Create New Session"
                message={`Start a new administration for ${trimmedLabel}?`}
                confirmText={isSubmitting ? 'Creating...' : 'Confirm'}
                cancelText="Cancel"
                onConfirm={handleConfirmCreateSession}
                onCancel={handleCancelConfirmation}
                isBusy={isSubmitting}
                variant="default"
                role="alertdialog"
                closeOnBackdrop={true}
                initialFocus="cancel"
            />
        </div>
    )
}

export default RegistrationPage