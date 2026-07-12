import React, { useState, useEffect, type ChangeEvent } from 'react';
import { IoClose } from "react-icons/io5"; // Make sure to install react-icons
export interface ProjectForm {
     name:string;
     techStack: string;
     targetUser: string;
     purpose: string;
     explanationDepth: 'beginner' | 'intermediate' | 'expert';
     learningOrientation: string;
     knownConstraints: string;
}

interface Props {
     initialData: ProjectForm;
     onClose: () => void;
     onDone: (data: ProjectForm) => void;
}

export default function ProjectInquiryForm({ initialData, onClose, onDone, }: Props) {

     const [formData, setFormData] = useState<ProjectForm>({
          techStack: initialData.techStack,
          targetUser: initialData.targetUser,
          purpose: initialData.purpose,
          explanationDepth: initialData.explanationDepth,
          name: initialData.name,
          learningOrientation: '',
          knownConstraints: '',
     });
     useEffect(() => {
          setFormData(initialData);
     }, [initialData]);

     const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
          const { name, value } = e.target;
          setFormData((prev) => ({ ...prev, [name]: value }));
     };
     const handleFormSubmit = (e: React.FormEvent) => {
          e.preventDefault();
          onDone(formData);
     };

     ;

     return (
          <div style={formStyles.container}>
               <header style={formStyles.header}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                         <div>
                              <h2 style={formStyles.title}> More in depth flow  </h2>
                              <p style={formStyles.subtitle}>Define your parameters for the project build.</p>
                         </div>

                         {/* FIX 2: Added the X sign as requested */}
                         <IoClose
                              style={{ fontSize: '24px', cursor: 'pointer' }}
                              onClick={onClose} />
                    </div>
               </header>

               <form onSubmit={handleFormSubmit} style={formStyles.formBody}>
                    <div style={formStyles.grid}>
                         <div style={formStyles.field}>
                              <label style={formStyles.label}>Tech Stack</label>
                              <input
                                   style={formStyles.input} name="techStack"
                                   value={formData.techStack} // Important: value makes it persistent
                                   placeholder="React, Tailwind, Node..."
                                   onChange={handleChange} />
                         </div>

                         <div style={formStyles.field}>
                              <label style={formStyles.label}>Target User</label>
                              <input
                                   style={formStyles.input} name="targetUser"
                                   value={formData.targetUser}
                                   placeholder="e.g. End Users, Devs"
                                   onChange={handleChange} />
                         </div>
                    </div>

                    <div style={formStyles.field}>
                         <label style={formStyles.label}>Purpose & Goal</label>
                         <textarea
                              style={{ ...formStyles.input, height: '80px' }} name="purpose"
                              value={formData.purpose}
                              placeholder="What are we building?"
                              onChange={handleChange} />
                    </div>

                    <div style={formStyles.grid}>
                         <div style={formStyles.field}>
                              <label style={formStyles.label}>Explanation Depth</label>
                              <select
                                   style={formStyles.input}
                                   name="explanationDepth"
                                   value={formData.explanationDepth}
                                   onChange={handleChange}
                              >
                                   <option value="beginner">Beginner</option>
                                   <option value="intermediate">Intermediate</option>
                                   <option value="expert">Expert</option>
                              </select>
                         </div>

                         <div style={formStyles.field}>
                              <label style={formStyles.label}>Learning Orientation</label>
                              <input
                                   style={formStyles.input} name="learningOrientation"
                                   value={formData.learningOrientation}
                                   placeholder="e.g. Concept-heavy"
                                   onChange={handleChange} />
                         </div>
                    </div>

                    <div style={formStyles.field}>
                         <label style={formStyles.label}>Known Constraints</label>
                         <input
                              style={formStyles.input} name="knownConstraints"
                              value={formData.knownConstraints}
                              placeholder="e.g. Limited API, No External CSS"
                              onChange={handleChange} />
                    </div>

                    <div style={formStyles.footer}>
                         <button type="button" onClick={onClose} style={formStyles.cancelBtn}>
                              Cancel
                         </button>
                         {/* Done button saves the current formData back to the Sidebar */}
                         <button type="submit" onClick={() => onDone(formData)} style={formStyles.doneBtn}>
                              Done
                         </button>
                    </div>
               </form>
          </div>
     );

}

const formStyles: { [key: string]: React.CSSProperties } = {
     container: {
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          overflow: 'hidden',
          fontFamily: '"Segoe UI", Roboto, sans-serif',
     },
     header: {
          backgroundColor: '#001F46', // Matching your sidebar color
          padding: '20px 24px',
          color: 'white',
     },
     title: {
          margin: 0,
          fontSize: '20px',
          fontWeight: 600,
     },
     subtitle: {
          margin: '4px 0 0 0',
          fontSize: '13px',
          opacity: 0.8,
     },
     formBody: {
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
     },
     grid: {
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
     },
     field: {
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
     },
     label: {
          fontSize: '14px',
          fontWeight: 600,
          color: '#001F46',
     },
     input: {
          padding: '10px 12px',
          border: '1px solid #D1D5DB',
          borderRadius: '8px',
          fontSize: '14px',
          outline: 'none',
          transition: 'border-color 0.2s',
     },
     footer: {
          marginTop: '10px',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          borderTop: '1px solid #F3F4F6',
          paddingTop: '20px',
     },
     cancelBtn: {
          padding: '10px 20px',
          borderRadius: '8px',
          border: '1px solid #D1D5DB',
          backgroundColor: 'white',
          color: '#4B5563',
          fontWeight: 500,
          cursor: 'pointer',
     },
     doneBtn: {
          padding: '10px 24px',
          borderRadius: '8px',
          border: 'none',
          backgroundColor: '#0056D2', // A vibrant blue for the action button
          color: 'white',
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
     },
};