import { useMemo, useState } from 'react'
import MenuPage from './pages/MenuPage'
import RegistrationPage from './pages/RegistrationPage'
import AdministrationPage from './pages/AdministrationPage'
import InquiryPage from './pages/InquiryPage'
import CodingPage from './pages/CodingPage'
import RecordsPage from './pages/RecordsPage'
import './styles/menu-screen.css'

const ROUTES = {
  MENU: 'menu',
  REGISTRATION: 'registration',
  ADMINISTRATION: 'administration',
  INQUIRY: 'inquiry',
  CODING: 'coding',
  RECORDS: 'records'
}

function App() {
  const [currentRoute, setCurrentRoute] = useState(ROUTES.MENU)
  const [selectedSession, setSelectedSession] = useState(null)

  function handleNavigateMenu() {
    setCurrentRoute(ROUTES.MENU)
  }

  function handleNavigateRegistration() {
    setCurrentRoute(ROUTES.REGISTRATION)
  }

  function handleNavigateAdministration(session = null) {
    if (session) {
      setSelectedSession(session)
    }
    setCurrentRoute(ROUTES.ADMINISTRATION)
  }

  function handleNavigateInquiry(session = null) {
    setSelectedSession(session ?? null)
    setCurrentRoute(ROUTES.INQUIRY)
  }

  function handleNavigateCoding(session) {
    setSelectedSession(session ?? null)
    setCurrentRoute(ROUTES.CODING)
  }

  function handleNavigateRecords(session) {
    setSelectedSession(session ?? null)
    setCurrentRoute(ROUTES.RECORDS)
  }

  function handleRegistrationComplete(session) {
    setSelectedSession(session ?? null)
    setCurrentRoute(ROUTES.ADMINISTRATION)
  }

  const currentPage = useMemo(() => {
    switch (currentRoute) {
      case ROUTES.REGISTRATION:
        return (
          <RegistrationPage
            onNavigateMenu={handleNavigateMenu}
            onRegistrationComplete={handleRegistrationComplete}
          />
        )

      case ROUTES.ADMINISTRATION:
        return (
          <AdministrationPage
            onNavigateMenu={handleNavigateMenu}
            onNavigateInquiry={handleNavigateInquiry}
            selectedSession={selectedSession}
          />
        )

      case ROUTES.INQUIRY:
        return (
          <InquiryPage
            onNavigateMenu={handleNavigateMenu}
            selectedSession={selectedSession}
          />
        )

      case ROUTES.CODING:
        return (
          <CodingPage
            onNavigateMenu={handleNavigateMenu}
            selectedSession={selectedSession}
          />
        )

      case ROUTES.RECORDS:
        return (
          <RecordsPage
            onNavigateMenu={handleNavigateMenu}
            selectedSession={selectedSession}
          />
        )

      case ROUTES.MENU:
      default:
        return (
          <MenuPage
            onNavigateAdministration={handleNavigateRegistration}
            onNavigateCoding={handleNavigateCoding}
            onNavigateRecords={handleNavigateRecords}
          />
        )
    }
  }, [currentRoute, selectedSession])

  return currentPage
}

export default App