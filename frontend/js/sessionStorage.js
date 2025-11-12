const API_URL = 'http://localhost:5000/api';

export async function saveSession(sessionData) {
  try {
    const response = await fetch(`${API_URL}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(sessionData),
      credentials: 'include'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save session');
    }
    
    return await response.json();
  } catch (err) {
    console.error('Error saving session:', err);
    throw err;
  }
}

export async function getUserSessions(userId, type = null) {
  try {
    const url = type 
      ? `${API_URL}/sessions/type/${type}/user/${userId}`
      : `${API_URL}/sessions/user/${userId}`;
      
    const response = await fetch(url, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch sessions');
    }
    
    return await response.json();
  } catch (err) {
    console.error('Error fetching sessions:', err);
    throw err;
  }
}