import { createContext, useContext, useState } from "react";

// Context 생성
const AlertContext = createContext();
export const useAlert = () => useContext(AlertContext);

// Provider 컴포넌트
const PopAlert = ({ children }) => {
  const [alertData, setAlertData] = useState({ message: "", buttons: [] });
  const [isOpen, setIsOpen] = useState(false);

  const showAlert = (message, buttons) => {
    setAlertData({ message, buttons });
    setIsOpen(true);
  };

  const closeAlert = () => {
    setIsOpen(false);
    setAlertData({ message: "", buttons: [] });
  };

  return (
    <AlertContext.Provider value={{ showAlert, closeAlert }}>
      {children}

      {isOpen && (
        <div id="pop_alert">
          <div className="alert_wrap">
            <p>{alertData.message}</p>
            <ul>
              {alertData.buttons.map((btn, idx) => (
                <li key={idx}>
                  <button 
                  className={btn.className || ""}
                  onClick={() => { btn.onClick(); closeAlert(); }}>
                    {btn.text}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
};

export default PopAlert;
