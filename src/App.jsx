import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import SignUP from './signUp'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <SignUP />
    </>
  )
}

export default App
