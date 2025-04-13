import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { Modal, Button } from 'react-bootstrap';
import TabsHeader from '../components/TabsHeader';

function RecommendationDisplay({ recommendation, onRegenerate, onSave }) {
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    console.log("Recommendation received:", recommendation);
  }, [recommendation]);

  const handleImageClick = (url) => setSelectedImage(url);
  const handleClose = () => setSelectedImage(null);

  if (!recommendation.outfit || !Array.isArray(recommendation.outfit)) {
    return (
      <div style={{ marginTop: '20px' }}>
        <h3>Recommended Outfit</h3>
        <p>Error: Recommendation data is not available or invalid.</p>
      </div>
    );
  }

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

      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <button 
          onClick={onRegenerate}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f0f0f0',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Regenerate
        </button>
        <button 
          onClick={onSave}
          style={{
            padding: '8px 16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Save Outfit
        </button>
      </div>

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
  const messagesEndRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastPrompt, setLastPrompt] = useState('');

  useEffect(() => {
    const storedMessages = localStorage.getItem('chatHistory');
    if (storedMessages) {
      setMessages(JSON.parse(storedMessages));
    } else {
      setMessages([
        {
          role: 'assistant',
          content: 'Welcome! Ask for an outfit recommendation by describing what you are looking for.',
        },
      ]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(messages));
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (imageUrl) {
      setInput(`Outfit recommendation for image: ${imageUrl}`);
    }
  }, [imageUrl]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e, promptOverride = null) => {
    e?.preventDefault();
    const prompt = promptOverride || input;
    if (prompt.trim() === '') return;

    const userMessage = { role: 'user', content: prompt };
    setMessages((prev) => [...prev, userMessage]);
    if (!promptOverride) {
      setInput('');
      setLastPrompt(prompt);
    }
    setLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:5001/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_prompt: userMessage.content }),
      });
      const data = await response.json();

      if (data.outfit && data.explanation && data.styling) {
        const recommendationMessage = { 
          role: 'recommendation', 
          content: data,
          promptUsed: prompt
        };
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

  const handleRegenerate = (prompt) => {
    const regeneratePrompt = `Give me another outfit option for: ${prompt}`;
    handleSend(null, regeneratePrompt);
  };

  const handleSaveOutfit = (outfitData) => {
    try {
      const newOutfit = {
        id: Date.now().toString(),
        images: outfitData.outfit,
        explanation: outfitData.explanation,
        stylingTips: outfitData.styling,
        createdAt: new Date().toISOString()
      };

      let savedOutfits = [];
      try {
        const stored = localStorage.getItem('savedOutfits');
        savedOutfits = stored ? JSON.parse(stored) : [];
      } catch (e) {
        console.error('Error parsing saved outfits:', e);
        savedOutfits = [];
      }

      const updatedOutfits = [...savedOutfits, newOutfit];
      localStorage.setItem('savedOutfits', JSON.stringify(updatedOutfits));
      
      alert('Outfit saved to your collections!');
    } catch (error) {
      console.error('Error saving outfit:', error);
      alert('Failed to save outfit. Please try again.');
    }
  };

  return (
    <div className="container" style={{ 
      marginTop: '20px',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <TabsHeader darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        maxWidth: '600px',
        margin: '0 auto',
        padding: '20px 0',
        overflow: 'hidden'
      }}>
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 20px',
          marginBottom: '20px',
          background: '#f7f7f7',
          borderRadius: '8px',
          boxShadow: '0 0 10px rgba(0,0,0,0.1)'
        }}>
          <div style={{ padding: '20px' }}>
            {messages.map((msg, index) => {
              if (msg.role === 'recommendation') {
                return (
                  <RecommendationDisplay 
                    key={index}
                    recommendation={msg.content}
                    onRegenerate={() => handleRegenerate(msg.promptUsed || lastPrompt)}
                    onSave={() => handleSaveOutfit(msg.content)}
                  />
                );
              } else {
                return (
                  <div
                    key={index}
                    className={`message-bubble ${msg.role === 'assistant' ? 'assistant-bubble' : 'user-bubble'}`}
                    style={{
                      marginBottom: '10px',
                      textAlign: msg.role === 'assistant' ? 'left' : 'right',
                      background: msg.role === 'assistant' ? '#e1f5fe' : '#c8e6c9',
                      padding: '10px',
                      borderRadius: '8px',
                      whiteSpace: 'pre-wrap',
                      color: '#000',
                      wordBreak: 'break-word'
                    }}
                  >
                    {msg.content.split('\n').map((line, i) => (
                      <div key={i}>{line}</div>
                    ))}
                  </div>
                );
              }
            })}
            {loading && <div style={{ textAlign: 'center', fontStyle: 'italic' }}>Loading...</div>}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <form
          onSubmit={handleSend}
          style={{
            display: 'flex',
            width: '100%',
            padding: '0 20px'
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