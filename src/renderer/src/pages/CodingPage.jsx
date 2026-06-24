function CodingPage({ onNavigateMenu, selectedSession }) {
    return (
        <div className="menu-screen">
            <div className="menu-screen__header" />

            <div className="menu-screen__title">Coding</div>

            <div className="menu-screen__panel">
                <div className="menu-screen__empty">
                    {selectedSession
                        ? `Coding page placeholder for ${selectedSession.participantLabel ?? 'selected record'}.`
                        : 'No record selected.'}
                </div>

                <div className="menu-screen__empty">
                    {selectedSession
                        ? `Session ID: ${selectedSession.sessionId ?? '—'}`
                        : 'Return to menu and select a record first.'}
                </div>

                <div className="menu-screen__panel-buttons">
                    <button
                        type="button"
                        className="menu-screen__action-button menu-screen__action-button--coding"
                        onClick={onNavigateMenu}
                    >
                        Back to Menu
                    </button>
                </div>
            </div>
        </div>
    )
}

export default CodingPage