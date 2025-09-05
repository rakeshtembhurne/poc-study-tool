// Final test with React component and formatting issues - TESTING HUSKY PRE-COMMIT HOOKS
// Testing commitlint validation - ROUND 2
import React from "react"

// Missing semicolons, inconsistent spacing, mixed quotes
interface Props {
  title: string;
  count: number;
  unused?: boolean; // This should trigger unused variable warning
}

const TestComponent: React.FC<Props> = ({ title, count }) => {
  const [state, setState] = React.useState(0);

  // Intentional formatting issues for testing
  const handleClick = () => {
    setState(state + 1);
  };

  // Properly typed function
  const anotherFunction = (x: number, y: number): number => {
    return x + y;
  };

  return (
    <div className="test-component">
      <h1>{title}</h1>
      <p>Count: {count}</p>
      <button onClick={handleClick}>Increment: {state}</button>
      <span>{anotherFunction(1, 2)}</span>
    </div>
  );
};

export default TestComponent;
