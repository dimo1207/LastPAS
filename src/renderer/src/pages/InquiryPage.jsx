import React, { useMemo, useState } from "react";
import "../styles/AdministrationPage.css";
import "../styles/InquiryPage.css";
import leftArrow from "../assets/left.svg";
import rightArrow from "../assets/right.svg";

const SLIDE_COUNT = 10;

export default function InquiryPage({
    onNavigateMenu,
    selectedSession = null,
}) {
    const [currentSlide, setCurrentSlide] = useState(0);

    const slides = useMemo(
        () =>
            Array.from({ length: SLIDE_COUNT }, (_, index) => ({
                id: `card-${index + 1}`,
            })),
        []
    );

    const goToSlide = (index) => {
        if (index < 0 || index >= slides.length || index === currentSlide) return;
        setCurrentSlide(index);
    };

    const goPrevious = () => {
        if (currentSlide === 0) return;
        setCurrentSlide((prev) => prev - 1);
    };

    const goNext = () => {
        if (currentSlide === slides.length - 1) return;
        setCurrentSlide((prev) => prev + 1);
    };

    const atLastSlide = currentSlide === slides.length - 1;
    const sliderPercent =
        slides.length > 1 ? (currentSlide / (slides.length - 1)) * 100 : 0;

    return (
        <div className="inquiry-page">
            <div className="administration-page__topbar">
                <button
                    type="button"
                    className="administration-page__back"
                    onClick={onNavigateMenu}
                >
                    <span className="administration-page__back-icon" aria-hidden="true">
                        &#8592;
                    </span>
                    <span>Return to Menu</span>
                </button>
            </div>

            <header className="inquiry-page__header">
                <h1 className="inquiry-page__title">Inquiry</h1>
                <div className="inquiry-page__rule" />
            </header>

            <section className="carousel-section" aria-label="Inquiry carousel">
                <button
                    type="button"
                    className={`carousel__button carousel__button--left ${currentSlide === 0 ? "is-hidden" : ""}`}
                    onClick={goPrevious}
                    disabled={currentSlide === 0}
                    aria-label="Previous Slide"
                >
                    <img className="carousel-arrow-icon" src={leftArrow} alt="" aria-hidden="true" />
                </button>

                <div className="carousel">
                    <div className="carousel__track-container">
                        <ul
                            className="carousel__track"
                            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                        >
                            {slides.map((slide, index) => (
                                <li
                                    key={slide.id}
                                    className={`carousel__slide ${currentSlide === index ? "current-slide" : ""}`}
                                    aria-hidden={currentSlide !== index}
                                >
                                    <div className="carousel__slide__interior">
                                        <div className="inquiry-slide-body">
                                            <div className="inquiry-placeholder">
                                                Inquiry placeholder
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <button
                    type="button"
                    className={`carousel__button carousel__button--right ${atLastSlide ? "is-hidden" : ""}`}
                    onClick={goNext}
                    disabled={atLastSlide}
                    aria-label="Next Slide"
                >
                    <img className="carousel-arrow-icon" src={rightArrow} alt="" aria-hidden="true" />
                </button>
            </section>

            <div className="carousel__slider-nav" aria-label="Slide navigation">
                <div className="carousel__slider-wrapper">
                    <div
                        id="custom-handle"
                        aria-hidden="true"
                        style={{ left: `${sliderPercent}%` }}
                    >
                        {currentSlide + 1}/{slides.length}
                    </div>

                    <input
                        id="slider"
                        type="range"
                        min={0}
                        max={slides.length - 1}
                        step={1}
                        value={currentSlide}
                        onChange={(event) => goToSlide(Number(event.target.value))}
                        className="carousel__slider"
                        aria-label={`Slide ${currentSlide + 1} of ${slides.length}`}
                        style={{ "--slider-fill": `${sliderPercent}%` }}
                    />
                </div>
            </div>
        </div>
    );
}