// pages/fits.js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Modal, Button } from 'react-bootstrap';
import TabsHeader from '../components/TabsHeader';

function RecommendationDisplay({ recommendation }) {
  const [selectedImage, setSelectedImage] = useState(null);

  const handleImageClick = (url) => setSelectedImage(url);
  const handleClose = () => setSelectedImage(null);

  return (
    <div style={{ marginTop: '20px' }}>
      <h3>Recommended Outfit</h3>
      <div className="gridContainer" style={{ marginBottom: '20px' }}>
        {recommendation.outfit.map((url, index) => (
          <div
            key={index}
            className="gridItem"
            style={{ cursor: 'pointer' }}
            onClick={() => handleImageClick(url)}
          >
            <div className="aspectRatioBox">
              <img src={url} alt={`Outfit piece ${index}`} className="image" />
            </div>
          </div>
        ))}
      </div>
      <p>
        <strong>Explanation:</strong> {recommendation.explanation}
      </p>
      <p>
        <strong>Styling Tips:</strong> {recommendation.styling}
      </p>

      {selectedImage && (
        <Modal show={true} onHide={handleClose} centered>
          <Modal.Header closeButton>
            <Modal.Title>Magnified View</Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ textAlign: 'center' }}>
            <img
              src={selectedImage}
              alt="Magnified outfit piece"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>Close</Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
}

export default function Fits({ darkMode, toggleDarkMode }) {
  const router = useRouter();
  const { imageUrl } = router.query;

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Welcome! Ask for an outfit recommendation by describing what you are looking for.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (imageUrl) {
      setInput(`Outfit recommendation for image: ${imageUrl}`);
    }
  }, [imageUrl]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (input.trim() === '') return;

    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:5001/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_prompt: userMessage.content }),
      });
      const data = await response.json();

      if (data.outfit && data.explanation && data.styling) {
        const recommendationMessage = { role: 'recommendation', content: data };
        setMessages((prev) => [...prev, recommendationMessage]);
      } else if (data.error) {
        const errorMessage = { role: 'assistant', content: `Error: ${data.error}` };
        setMessages((prev) => [...prev, errorMessage]);
      } else {
        const unknownMessage = { role: 'assistant', content: 'Unexpected response from the server.' };
        setMessages((prev) => [...prev, unknownMessage]);
      }
    } catch (error) {
      const catchMessage = { role: 'assistant', content: `Error: ${error.message}` };
      setMessages((prev) => [...prev, catchMessage]);
    }
    setLoading(false);
  };

  return (
    <div className="container" style={{ marginTop: '20px' }}>
      <TabsHeader darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

      <div
        className="chat-wrapper"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          maxWidth: '600px',
          margin: '40px auto 0', // Center horizontally with auto margins
        }}
      >
        {/* 
          Keep the box background #f7f7f7, but override text color to black
          in night mode, so it's readable on this page only.
        */}
        <div
          className="chat-container"
          style={{
            width: '100%',
            background: '#f7f7f7',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 0 10px rgba(0,0,0,0.1)',
            color: darkMode ? '#000' : '#333',   // <-- Force black text in night mode
          }}
        >
          {messages.map((msg, index) => {
            if (msg.role === 'recommendation') {
              return <RecommendationDisplay key={index} recommendation={msg.content} />;
            } else {
              return (
                <div
                  key={index}
                  className={`message-bubble ${
                    msg.role === 'assistant' ? 'assistant-bubble' : 'user-bubble'
                  }`}
                  style={{
                    marginBottom: '10px',
                    textAlign: msg.role === 'assistant' ? 'left' : 'right',
                    background: msg.role === 'assistant' ? '#e1f5fe' : '#c8e6c9',
                    padding: '10px',
                    borderRadius: '8px',
                    whiteSpace: 'pre-wrap',
                    // Also ensure bubble text is black in night mode:
                    color: darkMode ? '#000' : '#333',
                  }}
                >
                  {msg.content.split('\n').map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                </div>
              );
            }
          })}
          {loading && (
            <div style={{ textAlign: 'center', fontStyle: 'italic' }}>Loading...</div>
          )}
        </div>

        {/* Chat Input Form */}
        <form
          onSubmit={handleSend}
          className="chat-form"
          style={{
            display: 'flex',
            width: '100%',
            marginTop: '20px',
          }}
        >
          <input
            type="text"
            placeholder="Enter your outfit prompt..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{
              flex: 1,
              padding: '10px',
              fontSize: '16px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              marginRight: '10px',
            }}
          />
          <button
            type="submit"
            className="send-button"
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              borderRadius: '4px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
