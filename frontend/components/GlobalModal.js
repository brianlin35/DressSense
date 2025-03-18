// components/GlobalModal.js
import React, { createContext, useState, useContext } from "react";
import { Modal } from "react-bootstrap";

const ModalContext = createContext();

export function ModalProvider({ children }) {
  const [show, setShow] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  const openModal = (url) => {
    setImageUrl(url);
    setShow(true);
  };

  const closeModal = () => {
    setShow(false);
    setImageUrl("");
  };

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      <Modal show={show} onHide={closeModal} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Image Preview</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <img
            src={imageUrl}
            alt="Preview"
            style={{ width: "100%", height: "auto", objectFit: "contain" }}
          />
        </Modal.Body>
      </Modal>
    </ModalContext.Provider>
  );
}

export function useModal() {
  return useContext(ModalContext);
}