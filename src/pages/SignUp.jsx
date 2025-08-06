import React, { useState } from 'react';
import countryList from 'react-select-country-list'; 
import { STATES } from '../utils/stateList';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';


const SignupForm = () => {
  const countries = countryList().getData();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    companyName: '',
    email: '',
    password: '',
    passwordConfirm: '',
    jobRole: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    phone: '',
    country: '',
    postalCode: '',
    agreeTerms: false,
    agreeMarketing: false,
  });

  const [errors, setErrors] = useState({});
  const availableStates = STATES[formData.country] || [];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

const validate = () => {
  const newErrors = {};
  const requiredFields = [
    'firstName',
    'lastName',
    'companyName',
    'email',
    'password',
    'passwordConfirm',
    'jobRole',
    'address1',
    'city',
    'state',
    'phone',
    'country',
    'postalCode',
  ];

  requiredFields.forEach((field) => {
    if (!formData[field]) {
      newErrors[field] = 'This field is required';
    }
  });

  // Password match check
  if (formData.password !== formData.passwordConfirm) {
    newErrors.passwordConfirm = 'Passwords do not match';
  }

  // Password strength check (or allow '111' for dev)
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,20}$/;
  if (formData.password !== '111' && !passwordRegex.test(formData.password)) {
    newErrors.password = 'Password must be 8–20 characters and include uppercase, lowercase, number, and special character';
  }

  if (!formData.agreeTerms) {
    newErrors.agreeTerms = 'You must agree to the terms to continue';
  }

  if (!formData.agreeMarketing) {
    newErrors.agreeMarketing = 'You must consent to marketing to continue';
  }

  return newErrors;
};



const handleSubmit = async (e) => {
  e.preventDefault();
  const validationErrors = validate();

  if (Object.keys(validationErrors).length === 0) {
    try {
      console.log('Submitting form data to backend:', formData);
      const response = await axios.post('http://localhost:3002/register', {
        first_name: formData.firstName,
        last_name: formData.lastName,
        company_name: formData.companyName,
        email: formData.email,
        password: formData.password,
        job_role: formData.jobRole,
        address1: formData.address1,
        address2: formData.address2,
        city: formData.city,
        state: formData.state,
        phone: formData.phone,
        country: formData.country,
        postal_code: formData.postalCode,
        agree_terms: formData.agreeTerms,
        agree_marketing: formData.agreeMarketing,
      });

      if (response.status === 200) {
        alert('User registered successfully!');
        console.log('Server response:', response.data);
        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
          companyName: '',
          email: '',
          password: '',
          passwordConfirm: '',
          jobRole: '',
          address1: '',
          address2: '',
          city: '',
          state: '',
          phone: '',
          country: '',
          postalCode: '',
          agreeTerms: false,
          agreeMarketing: false,
        });
        setErrors({});
        navigate('/');
      }
    } catch (err) {
      console.error('Error submitting form:', err.response?.data || err.message);
      alert('An error occurred while submitting the form.');
    }
  } else {
    setErrors(validationErrors);
  }
};


  return (
    <form
      onSubmit={handleSubmit}
      style={{
        maxWidth: '600px',
        margin: '40px auto',
        padding: '30px',
        border: '1px solid #ccc',
        borderRadius: '12px',
        backgroundColor: '#f9f9f9',
        boxShadow: '0 0 10px rgba(0,0,0,0.1)',
      }}
    >
      <h2 style={{ textAlign: 'center' }}>Create New Account</h2>
      <p style={{ textAlign: 'center' }}>
        It's fast and free and you don't need Versiv to get started.
      </p>

      {[
        ['First name', 'firstName'],
        ['Last name', 'lastName'],
        ['Company name', 'companyName'],
        ['Email', 'email'],
        ['Password', 'password', 'password'],
        ['Confirm Password', 'passwordConfirm', 'password'],
        ['Job Role', 'jobRole'],
        ['Company Address Line 1', 'address1'],
        ['Company Address Line 2', 'address2', 'text', false],
        ['City', 'city'],
        ['Phone Number', 'phone'],
        ['Postal Code', 'postalCode'],
      ].map(([label, name, type = 'text', required = true]) => (
        <div key={name} style={{ marginBottom: 12 }}>
          <label>{label}</label>
          <input
            type={type}
            name={name}
            value={formData[name]}
            onChange={handleChange}
            required={required}
            style={{
              width: '100%',
              padding: 10,
              borderRadius: 6,
              border: '1px solid #ccc',
              marginTop: 4,
            }}
          />
          {errors[name] && <div style={{ color: 'red' }}>{errors[name]}</div>}
        </div>
      ))}

      <div style={{ marginBottom: 12 }}>
        <label>Country</label>
        <select
          name="country"
          value={formData.country}
          onChange={handleChange}
          style={{
            width: '100%',
            padding: 10,
            borderRadius: 6,
            border: '1px solid #ccc',
            marginTop: 4,
          }}
          required
        >
          <option value="">Select a country</option>
          {countries.map((c) => (
            <option key={c.value} value={c.label}>
              {c.label}
            </option>
          ))}
        </select>
        {errors.country && <div style={{ color: 'red' }}>{errors.country}</div>}
      </div>

      <div style={{ marginBottom: 12 }}>
        <label>State/Territory</label>
        {availableStates.length > 0 ? (
          <select
            name="state"
            value={formData.state}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: 10,
              borderRadius: 6,
              border: '1px solid #ccc',
              marginTop: 4,
            }}
            required
          >
            <option value="">Select a state</option>
            {availableStates.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            name="state"
            value={formData.state}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: 10,
              borderRadius: 6,
              border: '1px solid #ccc',
              marginTop: 4,
            }}
          />
        )}
        {errors.state && <div style={{ color: 'red' }}>{errors.state}</div>}
      </div>

      <div style={{ marginBottom: 8 }}>
        <label>
          <input
            type="checkbox"
            name="agreeTerms"
            checked={formData.agreeTerms}
            onChange={handleChange}
          />{' '}
          BY CLICKING "CREATE ACCOUNT" BELOW, YOU HAVE READ AND AGREE TO ABIDE BY OUR TERMS OF
          SERVICE AND ACKNOWLEDGE OUR PRIVACY POLICY.
        </label>
        {errors.agreeTerms && <div style={{ color: 'red' }}>{errors.agreeTerms}</div>}
      </div>

      <div style={{ marginBottom: 8 }}>
        <label>
          <input
            type="checkbox"
            name="agreeMarketing"
            checked={formData.agreeMarketing}
            onChange={handleChange}
          />{' '}
          By checking this box, I consent to receive marketing communications and product offers by
          email and phone from Fluke Networks, a division of Fluke Corporation, or its partners in
          accordance with its privacy policy.
        </label>
        {errors.agreeMarketing && <div style={{ color: 'red' }}>{errors.agreeMarketing}</div>}
      </div>

      <button
        type="submit"
        style={{
          padding: '12px 24px',
          fontSize: 16,
          fontWeight: 'bold',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          marginTop: '20px',
          width: '100%',
        }}
      >
        Create Account
      </button>

      <p
        onClick={() => navigate('/')}
        style={{
          marginTop: '16px',
          color: '#007bff',
          textDecoration: 'underline',
          cursor: 'pointer',
          textAlign: 'center',
        }}
      >
        Already have an account? Sign In
      </p>
    </form>
  );
};

export default SignupForm;
