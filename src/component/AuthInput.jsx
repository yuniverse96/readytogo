import React from 'react';

function AuthInput({ 
  label,
  type,
  name,
  value,
  onChange,
  placeholder,
  showLabel = 'null',
  showBtn = 'null',
  onButtonClick,
  btnText,
  msg = '',
  msgType = 'null' }) {
  const hasValue = value && value.trim() !== '';

  return (
    <div className={`input_compo ${showLabel}`}>
      {showLabel === 'top' && <div className='top_label'><p>{label}</p>{msg && <span className={`msg ${msgType}`}>{msg}</span>}</div>}
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
        {showBtn === 'check' &&  <button className = {showBtn} type="button" onClick={onButtonClick}>{btnText}</button>}
        {showBtn?.includes('show') && (
          <button className={showBtn} type="button" onClick={onButtonClick}>{btnText}</button>
        )}
      </div>
    </div>
  );
}

export default AuthInput;
