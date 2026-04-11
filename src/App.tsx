import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Home from "./pages/Home.tsx"
import Enroll from "./pages/Enrollment.tsx"
import Guardians from "./pages/GuardianSetup.tsx"
import Wallet from "./pages/Wallet.tsx"
import Recovery from "./pages/Recovery.tsx"
import Navbar from "./components/Navbar.tsx"

function App() {
  return (
    <Router>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/enroll" element={<Enroll />} />
        <Route path="/guardians" element={<Guardians />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/recovery" element={<Recovery />} />
      </Routes>
    </Router>
  )
}

export default App