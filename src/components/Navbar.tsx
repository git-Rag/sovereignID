import { Link } from "react-router-dom"

function Navbar() {
  return (
    <div style={{
      display: "flex",
      gap: "20px",
      justifyContent: "center",
      padding: "20px",
      background: "#111",
      color: "white"
    }}>
      <Link to="/" style={{color:"white"}}>Home</Link>
      <Link to="/enroll" style={{color:"white"}}>Enroll</Link>
      <Link to="/guardians" style={{color:"white"}}>Guardians</Link>
      <Link to="/wallet" style={{color:"white"}}>Wallet</Link>
      <Link to="/recovery" style={{color:"white"}}>Recovery</Link>
    </div>
  )
}

export default Navbar
