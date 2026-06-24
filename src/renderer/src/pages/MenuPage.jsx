import { useEffect, useMemo, useState } from 'react'
import Versions from '../components/Versions'

const ROWS_PER_PAGE = 10

function MenuPage({ onNavigateAdministration, onNavigateCoding, onNavigateRecords }) {
    const [menuRows, setMenuRows] = useState([])
    const [menuError, setMenuError] = useState('')
    const [menuMessage, setMenuMessage] = useState('')
    const [welcomeMessage, setWelcomeMessage] = useState('')
    const [selectedSessionId, setSelectedSessionId] = useState('')
    const [codingSystem, setCodingSystem] = useState('CS')
    const [isLoading, setIsLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)

    useEffect(() => {
        let cancelled = false

        async function loadMenuAdministrations() {
            setIsLoading(true)

            try {
                const result = await window.api?.listMenuAdministrations?.(200)
                const rowsFromDb = Array.isArray(result) ? result : []

                const mockRows = Array.from({ length: 25 }, (_, index) => ({
                    sessionId: `test-session-${index + 1}`,
                    participantLabel: `Test Participant ${index + 1}`,
                    dateAdministered: new Date(2026, 0, index + 1).toISOString(),
                    administrationStatus: index % 2 === 0 ? 'Valid' : 'Invalid',
                    codingPercentage: `${(index * 4) % 101}%`
                }))

                const rows = [...rowsFromDb, ...mockRows]

                if (!cancelled) {
                    setMenuRows(rows)
                    setMenuError('')
                    setMenuMessage('')
                    setCurrentPage(1)

                    if (rows.length > 0) {
                        setSelectedSessionId((currentId) => {
                            const stillExists = rows.some((row) => row.sessionId === currentId)
                            return stillExists ? currentId : rows[0].sessionId
                        })
                    } else {
                        setSelectedSessionId('')
                    }
                }
            } catch (err) {
                if (!cancelled) {
                    setMenuRows([])
                    setMenuError('Something went wrong, please try again')
                    setSelectedSessionId('')
                    setCurrentPage(1)
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false)
                }
            }
        }

        loadMenuAdministrations()

        return () => {
            cancelled = true
        }
    }, [])

    const totalPages = Math.max(1, Math.ceil(menuRows.length / ROWS_PER_PAGE))

    const paginatedRows = useMemo(() => {
        const startIndex = (currentPage - 1) * ROWS_PER_PAGE
        return menuRows.slice(startIndex, startIndex + ROWS_PER_PAGE)
    }, [menuRows, currentPage])

    const selectedRow = useMemo(
        () => menuRows.find((row) => row.sessionId === selectedSessionId) ?? null,
        [menuRows, selectedSessionId]
    )

    function formatDate(value) {
        if (!value) return '—'

        const parsed = new Date(value)

        if (Number.isNaN(parsed.getTime())) {
            return value
        }

        return parsed.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
        })
    }

    async function reloadMenuAdministrations(preferredSelectedId = '') {
        setIsLoading(true)

        try {
            const result = await window.api?.listMenuAdministrations?.(200)
            const rows = Array.isArray(result) ? result : []

            setMenuRows(rows)
            setMenuError('')
            setCurrentPage(1)

            if (rows.length === 0) {
                setSelectedSessionId('')
                return
            }

            const nextId =
                preferredSelectedId && rows.some((row) => row.sessionId === preferredSelectedId)
                    ? preferredSelectedId
                    : rows[0].sessionId

            setSelectedSessionId(nextId)
        } catch (err) {
            setMenuRows([])
            setMenuError('Could not load administrations.')
            setSelectedSessionId('')
            setCurrentPage(1)
        } finally {
            setIsLoading(false)
        }
    }

    function handleAdministrationClick() {
        setMenuMessage('')
        setMenuError('')
        onNavigateAdministration?.()
    }

    function handleCodingClick() {
        if (!selectedRow) {
            setMenuMessage('Please select a record')
            setMenuError('')
            return
        }

        setMenuMessage('')
        setMenuError('')
        onNavigateCoding?.(selectedRow)
    }

    function handleRecordsClick() {
        if (!selectedRow) {
            setMenuMessage('Please select a record')
            setMenuError('')
            return
        }

        setMenuMessage('')
        setMenuError('')
        onNavigateRecords?.(selectedRow)
    }

    function handleLogoutClick() {
        setMenuMessage('Logout is a placeholder for now.')
        setMenuError('')
    }

    function handleAutocodeClick(row) {
        setSelectedSessionId(row.sessionId)
        setMenuMessage(`Autocode placeholder for ${row.participantLabel ?? 'selected record'}.`)
        setMenuError('')
    }

    async function handleDeleteClick(sessionId) {
        const confirmed = window.confirm('Are you sure you want to remove this session?')

        if (!confirmed) return

        try {
            const result = await window.api?.deleteSession?.(sessionId)

            if (result?.ok) {
                setMenuMessage('Administration deleted.')
                setMenuError('')
                await reloadMenuAdministrations('')
            } else {
                setMenuMessage('Something went wrong, please try again')
                setMenuError('')
            }
        } catch (err) {
            setMenuMessage('Something went wrong, please try again')
            setMenuError('')
        }
    }

    function handleToggleCodingSystem() {
        setCodingSystem((current) => (current === 'CS' ? 'R-PAS' : 'CS'))
        setMenuMessage('')
        setMenuError('')
    }

    function handlePreviousPage() {
        setCurrentPage((page) => Math.max(1, page - 1))
    }

    function handleNextPage() {
        setCurrentPage((page) => Math.min(totalPages, page + 1))
    }

    return (
        <div className="menu-screen">
            <button type="button" className="menu-screen__logout" onClick={handleLogoutClick}>
                <span className="menu-screen__logout-text">Logout</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 30 30">
                    <g transform="translate(-3 -3)">
                        <path
                            d="M13.5,31.5h-6a3,3,0,0,1-3-3V7.5a3,3,0,0,1,3-3h6"
                            fill="none"
                            stroke="#707070"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="3"
                        />
                        <path
                            d="M24,25.5,31.5,18,24,10.5"
                            fill="none"
                            stroke="#707070"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="3"
                        />
                        <path
                            d="M31.5,18h-18"
                            fill="none"
                            stroke="#707070"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="3"
                        />
                    </g>
                </svg>
            </button>

            <div className="menu-screen__header" />

            {(menuError || menuMessage) && (
                <div className="menu-screen__feedback">
                    {menuError || menuMessage}
                </div>
            )}

            {welcomeMessage && (
                <div className="menu-screen__feedback menu-screen__feedback--welcome">
                    {welcomeMessage}
                </div>
            )}

            <div className="menu-screen__title">LastPAS</div>

            <div className="menu-screen__actions">
                <button
                    type="button"
                    className="menu-screen__action-button menu-screen__action-button--administration"
                    onClick={handleAdministrationClick}
                >
                    Administration
                </button>
                <button
                    type="button"
                    className="menu-screen__action-button menu-screen__action-button--coding"
                    onClick={handleCodingClick}
                >
                    Coding
                </button>
                <button
                    type="button"
                    className="menu-screen__action-button menu-screen__action-button--records"
                    onClick={handleRecordsClick}
                >
                    Records
                </button>
            </div>

            <div className="menu-screen__panel">
                <div className="menu-screen__table-wrap">
                    <table className="menu-screen__table">
                        <thead>
                            <tr>
                                <th>Participant Information</th>
                                <th>Date Administered</th>
                                <th>Administration Status</th>
                                <th>Coding % Complete</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading && (
                                <tr>
                                    <td colSpan="4" className="menu-screen__empty">
                                        Loading administrations...
                                    </td>
                                </tr>
                            )}

                            {!isLoading && menuRows.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="menu-screen__empty">
                                        No administrations found.
                                    </td>
                                </tr>
                            )}

                            {!isLoading &&
                                paginatedRows.map((row) => {
                                    const isSelected = row.sessionId === selectedSessionId

                                    return (
                                        <tr
                                            key={row.sessionId}
                                            className={isSelected ? 'menu-screen__row--selected' : ''}
                                            onClick={() => {
                                                setSelectedSessionId(row.sessionId)
                                                setMenuMessage('')
                                                setMenuError('')
                                            }}
                                        >
                                            <td>{row.participantLabel ?? '—'}</td>
                                            <td>{formatDate(row.dateAdministered)}</td>
                                            <td>{row.administrationStatus ?? '—'}</td>
                                            <td>{row.codingPercentage ?? '0%'}</td>
                                        </tr>
                                    )
                                })}
                        </tbody>
                    </table>

                    {!isLoading && menuRows.length > ROWS_PER_PAGE && (
                        <div className="menu-screen__pagination">
                            <div className="menu-screen__pagination-status">
                                Page {currentPage} of {totalPages}
                            </div>

                            <div className="menu-screen__pagination-buttons">
                                <button
                                    type="button"
                                    className="menu-screen__pagination-button"
                                    onClick={handlePreviousPage}
                                    disabled={currentPage === 1}
                                >
                                    Previous
                                </button>

                                <button
                                    type="button"
                                    className="menu-screen__pagination-button"
                                    onClick={handleNextPage}
                                    disabled={currentPage === totalPages}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="menu-screen__panel-buttons">
                    <div className="menu-screen__tooltip">
                        <button
                            type="button"
                            className="menu-screen__icon-button menu-screen__icon-button--left"
                            onClick={() => reloadMenuAdministrations(selectedSessionId)}
                            title="Refresh table"
                            aria-label="Refresh table"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 23.985 24">
                                <path
                                    d="M26.475,9.525A12,12,0,1,0,29.6,21h-3.12A9,9,0,1,1,18,9a8.872,8.872,0,0,1,6.33,2.67L19.5,16.5H30V6Z"
                                    transform="translate(-6.015 -6)"
                                    fill="#707070"
                                />
                            </svg>
                        </button>
                        <span className="menu-screen__tooltip-text">Recover lost data</span>
                    </div>

                    <button
                        type="button"
                        className="menu-screen__autocode"
                        onClick={() => {
                            if (!selectedRow) {
                                setMenuMessage('Please select a record')
                                setMenuError('')
                                return
                            }
                            handleAutocodeClick(selectedRow)
                        }}
                        title="Autocode"
                        aria-label="Autocode"
                    >
                        <div className="menu-screen__autocode-center menu-screen__autocode-center--top">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" viewBox="0 0 27 36">
                                <path
                                    d="M23.625,4.5H18a4.5,4.5,0,0,0-9,0H3.375A3.376,3.376,0,0,0,0,7.875v24.75A3.376,3.376,0,0,0,3.375,36h20.25A3.376,3.376,0,0,0,27,32.625V7.875A3.376,3.376,0,0,0,23.625,4.5ZM13.5,2.813A1.688,1.688,0,1,1,11.813,4.5,1.683,1.683,0,0,1,13.5,2.813Zm8.522,16.3-10.055,9.97a.845.845,0,0,1-1.2-.007L4.964,23.217a.845.845,0,0,1,.007-1.2l2-1.983a.845.845,0,0,1,1.2.007L11.4,23.309l7.453-7.4a.845.845,0,0,1,1.2.007l1.983,2A.845.845,0,0,1,22.022,19.111Z"
                                    fill="#707070"
                                />
                            </svg>
                        </div>
                        <div className="menu-screen__autocode-center menu-screen__autocode-center--bottom">
                            <span className="menu-screen__autocode-label">AutoCode</span>
                        </div>
                    </button>

                    <div className="menu-screen__tooltip">
                        <button
                            type="button"
                            className="menu-screen__icon-button menu-screen__icon-button--right"
                            onClick={() => {
                                if (!selectedRow?.sessionId) {
                                    setMenuMessage('Please select a record')
                                    setMenuError('')
                                    return
                                }
                                handleDeleteClick(selectedRow.sessionId)
                            }}
                            title="Remove selection"
                            aria-label="Remove selection"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12.694" height="15.508" viewBox="0 0 19.694 22.508">
                                <path
                                    d="M1.407,20.4a2.11,2.11,0,0,0,2.11,2.11H16.177a2.11,2.11,0,0,0,2.11-2.11V5.627H1.407ZM13.364,9.144a.7.7,0,1,1,1.407,0v9.847a.7.7,0,1,1-1.407,0Zm-4.22,0a.7.7,0,0,1,1.407,0v9.847a.7.7,0,1,1-1.407,0Zm-4.22,0a.7.7,0,0,1,1.407,0v9.847a.7.7,0,1,1-1.407,0ZM18.991,1.407H13.716L13.3.585A1.055,1.055,0,0,0,12.357,0H7.333a1.043,1.043,0,0,0-.941.585l-.413.822H.7a.7.7,0,0,0-.7.7V3.517a.7.7,0,0,0,.7.7H18.991a.7.7,0,0,0,.7-.7V2.11A.7.7,0,0,0,18.991,1.407Z"
                                    transform="translate(0 0)"
                                    fill="#707070"
                                />
                            </svg>
                        </button>
                        <span className="menu-screen__tooltip-text">Remove selection</span>
                    </div>
                </div>
            </div>

            <div className="menu-screen__system">
                <div
                    className={[
                        'menu-screen__system-label',
                        'menu-screen__system-label--cs',
                        codingSystem === 'CS' ? 'menu-screen__system-label--active' : ''
                    ].join(' ')}
                >
                    CS (Exner)
                </div>

                <button
                    type="button"
                    className="menu-screen__switch-bottom"
                    onClick={handleToggleCodingSystem}
                    aria-label="Toggle coding system"
                />

                <button
                    type="button"
                    className={[
                        'menu-screen__switch-button',
                        codingSystem === 'R-PAS' ? 'menu-screen__switch-button--rpas' : ''
                    ].join(' ')}
                    onClick={handleToggleCodingSystem}
                    aria-label="Toggle coding system"
                />

                <div
                    className={[
                        'menu-screen__system-label',
                        'menu-screen__system-label--rpas',
                        codingSystem === 'R-PAS' ? 'menu-screen__system-label--active' : ''
                    ].join(' ')}
                >
                    R-PAS
                </div>
            </div>

            <div className="menu-screen__versions">
                <Versions />
            </div>
        </div>
    )
}

export default MenuPage