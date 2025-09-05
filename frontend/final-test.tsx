// Final test with React component and formatting issues - TESTING HUSKY PRE-COMMIT HOOKS
import React from "react"

interface Props{
  title:string
  count:   number
}

const TestComponent: React.FC<Props> = ({ title, count }) => {
  const [state, setState] = React.useState(0)
  
  // Intentional formatting issues for testing
  const handleClick=()=>{
    setState(state+1)
  }

  return (
    <div className='test-component'   >
      <h1>{ title }</h1>
      <p>Count: {count}</p>
      <button onClick={handleClick}>Increment: {state}</button>
    </div>
  )
}

export default TestComponent
