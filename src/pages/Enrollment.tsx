import { useState } from "react"

function Enroll() {

  const [did, setDid] = useState("")

  const createDID = () => {

    const fakeDID = "did:ion:" + Math.random().toString(36).substring(2)

    setDid(fakeDID)
  }

  return (
    <div style={{textAlign:"center", marginTop:"60px"}}>

      <h2>Create Your Digital Identity</h2>

      <button onClick={createDID}>
        Generate DID
      </button>

      {did && (
        <p>Your DID: {did}</p>
      )}

    </div>
  )
}

export default Enroll