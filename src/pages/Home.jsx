import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import PromptDialog from '../components/PromptDialog';
import axios from 'axios';
import { Link } from 'react-router-dom';


const Home = () => {
  const location = useLocation();

  const [promptOpen, setPromptOpen] = useState(false);
  const [promptTitle, setPromptTitle] = useState('');
  const [onPromptClose, setOnPromptClose] = useState(() => () => {});
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);


  const [user, setUser] = useState({  
    email: location.state?.email || 'Guest',
    organisations: [],
  });

  const showPrompt = (title) =>
  new Promise((resolve) => {
    setPromptTitle(title);
    setOnPromptClose(() => (value) => {
      setPromptOpen(false);
      resolve(value);
    });
    setPromptOpen(true);
  });

const saveToDB = async () => {
  console.log('saveToDB triggered. isOnline =', isOnline);

  try {
    if (isOnline) {
      await axios.post('http://localhost:3002/api/save-hierarchy', user);
      alert('Hierarchy saved to DB!');
    } else {
      throw new Error('Offline mode (simulated fallback)');
    }
  } catch (err) {
    console.warn('Saving to remote DB failed. Reason:', err.message);
    if (window?.electron?.ipcRenderer) {
      window.electron.ipcRenderer.send('save-local', user);
      alert('No internet. Data saved locally.');
    } else {
      console.warn('IPC not available; cannot save locally.');
    }
  }
};


useEffect(() => {
  if (isOnline && window?.electron?.ipcRenderer) {
    console.log('Network restored, syncing local to remote...');
    window.electron.ipcRenderer.send('sync-local-to-remote');
  }
}, [isOnline]);





const addOrganisation = async () => {
  const name = await showPrompt('Enter Organisation Name:');
  if (!name) return;
  setUser((prev) => ({
    ...prev,
    organisations: [...prev.organisations, { name, projects: [] }],
  }));
};

const addProject = async (orgIndex) => {
  const name = await showPrompt('Enter Project Name:');
  if (!name) return;
  const updatedOrgs = [...user.organisations];
  updatedOrgs[orgIndex].projects.push({ name, subprojects: [] });
  setUser({ ...user, organisations: updatedOrgs });
};

const addSubproject = async (orgIndex, projIndex) => {
  const name = await showPrompt('Enter Subproject Name:');
  if (!name) return;
  const updatedOrgs = [...user.organisations];
  updatedOrgs[orgIndex].projects[projIndex].subprojects.push({ name, testSetups: [] });
  setUser({ ...user, organisations: updatedOrgs });
};

const addTestSetup = async (orgIndex, projIndex, subIndex) => {
  const name = await showPrompt('Enter Test Setup Name:');
  if (!name) return;
  const updatedOrgs = [...user.organisations];
  updatedOrgs[orgIndex].projects[projIndex].subprojects[subIndex].testSetups.push({ name, cableIDs: [] });
  setUser({ ...user, organisations: updatedOrgs });
};

const addCableID = async (orgIndex, projIndex, subIndex, testIndex) => {
  const name = await showPrompt('Enter Cable ID Name:');
  if (!name) return;
  const updatedOrgs = [...user.organisations];
  updatedOrgs[orgIndex].projects[projIndex].subprojects[subIndex].testSetups[testIndex].cableIDs.push({ name, fibers: [] });
  setUser({ ...user, organisations: updatedOrgs });
};

const addFiber = async (orgIndex, projIndex, subIndex, testIndex, cableIndex) => {
  const name = await showPrompt('Enter Fiber Name:');
  if (!name) return;
  const updatedOrgs = [...user.organisations];
  updatedOrgs[orgIndex].projects[projIndex].subprojects[subIndex].testSetups[testIndex].cableIDs[cableIndex].fibers.push({
    name,
    mpoLossLength: [],
    fiberInspectors: [],
  });
  setUser({ ...user, organisations: updatedOrgs });
};

const addMPOLossLength = async (orgIndex, projIndex, subIndex, testIndex, cableIndex, fiberIndex) => {
  const name = await showPrompt('Enter MPO Loss/Length Name:');
  if (!name) return;
  const fiber = user.organisations[orgIndex].projects[projIndex].subprojects[subIndex].testSetups[testIndex].cableIDs[cableIndex].fibers[fiberIndex];
  fiber.mpoLossLength.push({ name });
  setUser({ ...user });
};

const addFiberInspector = async (orgIndex, projIndex, subIndex, testIndex, cableIndex, fiberIndex) => {
  const name = await showPrompt('Enter Fiber Inspector Name:');
  if (!name) return;
  const fiber = user.organisations[orgIndex].projects[projIndex].subprojects[subIndex].testSetups[testIndex].cableIDs[cableIndex].fibers[fiberIndex];
  fiber.fiberInspectors.push({ name });
  setUser({ ...user });
};


  return (
    <div style={{ padding: '20px' }}>
      <h2>Welcome to the Home Page</h2>
      <p>You are signed in as <strong>{user.email}</strong></p>

      <button onClick={addOrganisation}>Add Organisation</button>

      {user.organisations.map((org, orgIndex) => (
        <div key={orgIndex} style={{ marginLeft: '20px', marginTop: '10px' }}>
          <h3>Organisation: {org.name}</h3>
          <button onClick={() => addProject(orgIndex)}>Add Project</button>

          {org.projects.map((proj, projIndex) => (
            <div key={projIndex} style={{ marginLeft: '20px' }}>
              <h4>Project: {proj.name}</h4>
              <button onClick={() => addSubproject(orgIndex, projIndex)}>Add Subproject</button>

              {proj.subprojects.map((sub, subIndex) => (
                <div key={subIndex} style={{ marginLeft: '20px' }}>
                  <h5>Subproject: {sub.name}</h5>
                  <button onClick={() => addTestSetup(orgIndex, projIndex, subIndex)}>Add TestSetup</button>

                  {sub.testSetups.map((test, testIndex) => (
                    <div key={testIndex} style={{ marginLeft: '20px' }}>
                      <h5>TestSetup: {test.name}</h5>
                      <button onClick={() => addCableID(orgIndex, projIndex, subIndex, testIndex)}>Add CableID</button>

                      {test.cableIDs.map((cable, cableIndex) => (
                        <div key={cableIndex} style={{ marginLeft: '20px' }}>
                          <h5>CableID: {cable.name}</h5>
                          <button onClick={() => addFiber(orgIndex, projIndex, subIndex, testIndex, cableIndex)}>Add Fiber</button>

                          {cable.fibers.map((fiber, fiberIndex) => (
                            <div key={fiberIndex} style={{ marginLeft: '20px' }}>
                              <h5>Fiber: {fiber.name}</h5>
                              <button onClick={() => addMPOLossLength(orgIndex, projIndex, subIndex, testIndex, cableIndex, fiberIndex)}>Add MPO Loss/Length</button>
                              <button onClick={() => addFiberInspector(orgIndex, projIndex, subIndex, testIndex, cableIndex, fiberIndex)}>Add Fiber Inspector</button>

                              <ul>
                                {fiber.mpoLossLength.map((mpo, i) => (
                                  <li key={i}>MPO: {mpo.name}</li>
                                ))}
                                {fiber.fiberInspectors.map((fi, i) => (
                                  <li key={i}>Inspector: {fi.name}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
      <PromptDialog
  open={promptOpen}
  title={promptTitle}
  onClose={onPromptClose}
/>
<button onClick={saveToDB}>Save to DB</button>

<p>Status: <strong style={{ color: isOnline ? 'green' : 'red' }}>{isOnline ? 'Online' : 'Offline'}</strong></p>


<Link to="/ssh">
  <button
    style={{
      padding: '10px 20px',
      fontSize: '16px',
      cursor: 'pointer',
      borderRadius: '8px',
      backgroundColor: '#007bff',
      color: '#fff',
      border: 'none'
    }}
  >
    Go to SSH Manager
  </button>
</Link>

<Link to="/versiv-connectivity">
  <button
    style={{
      padding: '10px 20px',
      fontSize: '16px',
      cursor: 'pointer',
      borderRadius: '8px',
      backgroundColor: '#FFFFC5',
      color: 'black',
      border: 'none',
      margin: '10px'
    }}
  >
    Go to Versiv Connectivity
  </button>
</Link>


    </div>
  );
};

export default Home;
