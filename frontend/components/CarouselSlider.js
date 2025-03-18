// components/CarouselSlider.js
import React from 'react';
import Slider from "react-slick";
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";

const CarouselSlider = ({ images }) => {
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    cssEase: "linear", // smooth continuous effect
  };

  return (
    <Slider {...settings}>
      {images.map((url, idx) => (
        <div key={idx}>
          <a href={url} target="_blank" rel="noopener noreferrer">
            <img
              src={url}
              alt={`Slide ${idx}`}
              style={{ width: "100%", height: "400px", objectFit: "cover" }}
            />
          </a>
        </div>
      ))}
    </Slider>
  );
};

export default CarouselSlider;