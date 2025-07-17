import React from 'react';

function AuthInput({ label, type, name, value, onChange, placeholder, showLabel = 'top' }) {
  const hasValue = value && value.trim() !== '';

  return (
    <>
      {showLabel === 'top' && <p className='top_label'>{label}</p>}
      <div className={`input_wrap ${hasValue ? 'has_v' : ''}`}>
        {showLabel === 'inline' && <label htmlFor={name}>{label}</label>}
        <input
          id={name}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
      </div>
    </>
  );
}

export default AuthInput;
