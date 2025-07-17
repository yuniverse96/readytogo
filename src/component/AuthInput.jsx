import React from 'react';

function AuthInput({ label, type, name, value, onChange, placeholder }) {
  const hasValue = value && value.trim() !== '';

  return (
    <div className={`input_wrap ${hasValue ? 'has_v' : ''}`}>
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    </div>
  );
}

export default AuthInput;
