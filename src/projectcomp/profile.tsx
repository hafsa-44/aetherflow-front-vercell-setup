import React, { useState, useEffect } from 'react';
import api from '../api'; // Your axios instance
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: '', email: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ type: '', msg: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/users/profile");
        setUser(res.data);
      } catch (err) {
        setStatus({ type: 'error', msg: 'Failed to load user data.' });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    try {
      const res = await api.put("/users/profile", { 
        name: user.name, 
        email: user.email 
      });
      setUser(res.data);
      setIsEditing(false);
      setStatus({ type: 'success', msg: 'Profile updated successfully!' });
      setTimeout(() => setStatus({ type: '', msg: '' }), 3000);
    } catch (err) {
      setStatus({ type: 'error', msg: 'Update failed.' });
    }
  };
   const { logout } = useAuth(); 
  const handleDelete = async () => {
    if (window.confirm("Are you sure? This will permanently delete your account.")) {
      try {
        await api.delete("/users/profile");
        //localStorage.removeItem("token");
          await logout(); 
        navigate("/signin");
      } catch (err) {
        alert("Could not delete account.");
      }
    }
  };

  const styles: { [key: string]: React.CSSProperties } = {
    wrapper: { backgroundColor: "black", minHeight: "100vh", color: "black", padding: "70px 20px", display: "flex", flexDirection: "column", alignItems: "center", fontFamily: "sans-serif" },
    avatarSection: { textAlign: "center", marginBottom: "30px" },
    avatarCircle: { width: "120px", height: "120px", borderRadius: "50%", backgroundColor: "#1e293b", margin: "0 auto 15px", overflow: "hidden", border: "4px solid #1e293b", display: "flex", justifyContent: "center", alignItems: "center" },
    field: { width: "100%", maxWidth: "400px", marginBottom: "20px" },
    label: { display: "block", color: "#94a3b8", fontSize: "14px", fontWeight: "600", marginBottom: "8px" },
    input: { width: "100%", padding: "14px 16px", borderRadius: "12px", backgroundColor: "#1e293b", border: "1px solid #334155", color: "white", fontSize: "16px", outline: "none", transition: "0.2s" },
    primaryBtn: { width: "100%", maxWidth: "400px", padding: "14px", borderRadius: "12px", backgroundColor: "#38bdf8", color: "#121921", fontWeight: "bold", border: "none", cursor: "pointer", marginTop: "10px" },
    secondaryBtn: { width: "100%", maxWidth: "400px", padding: "14px", borderRadius: "12px", backgroundColor: "#1e293b", color: "white", fontWeight: "bold", border: "1px solid #334155", cursor: "pointer", marginTop: "10px" },
    deleteBtn: { color: "#ef4444", background: "#1e293b", border: "1px solid #334155", width: "100%", maxWidth: "400px", padding: "14px", borderRadius: "12px", marginTop: "40px", cursor: "pointer", fontWeight: "bold", letterSpacing: "1px" }
  };

  if (loading) return <div style={styles.wrapper}>Loading...</div>;

  return (
    <div style={styles.wrapper}>
      <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#94a3b8", marginBottom: "30px", textTransform: "uppercase", letterSpacing: "1px" }}>Profile</h2>

      <div style={styles.avatarSection}>
        <div style={styles.avatarCircle}>
           <img 
             src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} 
             alt="avatar" 
             style={{ width: "100%", height: "100%" }}
           />
        </div>
        <button style={{ color: "#38bdf8", background: "none", border: "none", fontSize: "14px", fontWeight: "bold", cursor: "pointer" }}>
          CHANGE AVATAR
        </button>
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Name</label>
        <input 
          style={{ ...styles.input, opacity: isEditing ? 1 : 0.7 }} 
          value={user.name} 
          disabled={!isEditing} 
          onChange={(e) => setUser({...user, name: e.target.value})} 
        />
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Username</label>
        <input 
          style={{ ...styles.input, opacity: 0.5 }} 
          value={user.name.toLowerCase().replace(/\s/g, '') + "4898"} 
          disabled 
        />
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Email Address</label>
        <input 
          style={{ ...styles.input, opacity: isEditing ? 1 : 0.7 }} 
          value={user.email} 
          disabled={!isEditing} 
          onChange={(e) => setUser({...user, email: e.target.value})} 
        />
      </div>

      {isEditing ? (
        <button style={styles.primaryBtn} onClick={handleSave}>SAVE CHANGES</button>
      ) : (
        <button style={styles.secondaryBtn} onClick={() => setIsEditing(true)}>EDIT PROFILE</button>
      )}

      {status.msg && (
        <p style={{ color: status.type === 'error' ? '#ef4444' : '#10b981', marginTop: '15px', fontSize: '14px' }}>
          {status.msg}
        </p>
      )}

      <button style={styles.deleteBtn} onClick={handleDelete}>DELETE ACCOUNT</button>
    </div>
  );
};

export default Profile;