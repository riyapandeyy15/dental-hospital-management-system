import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import Avatar from '../../components/shared/Avatar.jsx';
import * as publicDoctorService from '../../api/publicDoctorService.js';

const STEPS = [
  {
    icon: 'bi-search-heart',
    title: 'Find a Doctor',
    description: 'Browse dentists by specialization and see their real availability.',
  },
  {
    icon: 'bi-calendar2-check',
    title: 'Book an Appointment',
    description: 'Pick a date and time slot that works for you - confirmed instantly.',
  },
  {
    icon: 'bi-clipboard2-pulse',
    title: 'Get Care & Track It',
    description: 'Visit your dentist and keep track of every appointment in one place.',
  },
];

function Home() {
  const [featuredDoctors, setFeaturedDoctors] = useState([]);
  const [doctorsError, setDoctorsError] = useState('');
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(true);

  useEffect(() => {
    publicDoctorService
      .listPublicDoctors({ limit: 3 })
      .then((result) => setFeaturedDoctors(result.doctors))
      .catch(() => setDoctorsError('Could not load doctors right now.'))
      .finally(() => setIsLoadingDoctors(false));
  }, []);

  return (
    <div style={{ background: 'var(--dhms-bg)' }}>
      {/* Hero */}
      <section className="dhms-hero-gradient text-white">
        <div className="container py-5 py-lg-6">
          <div className="row align-items-center g-5 py-4">
            <div className="col-lg-7">
              <h1 className="display-5 fw-bold mb-3">Complete dental care, organized in one place.</h1>
              <p className="fs-5 text-white-50 mb-4" style={{ maxWidth: 560 }}>
                DentiFlow helps you find trusted dentists, check real availability and book
                appointments in minutes - all from one modern platform.
              </p>
              <div className="d-flex flex-wrap gap-3">
                <Link to="/register" className="dhms-btn-gradient btn btn-lg text-white d-inline-flex align-items-center gap-2">
                  <i className="bi bi-calendar-plus" />
                  Book an Appointment
                </Link>
                <Link to="/login" className="btn btn-outline-light btn-lg">
                  Sign In
                </Link>
              </div>
            </div>
            <div className="col-lg-5 d-none d-lg-block text-center">
              <i className="bi bi-heart-pulse display-1 opacity-25" style={{ fontSize: '12rem' }} aria-hidden="true" />
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container py-5">
        <div className="text-center mb-5">
          <h2 className="h3 fw-bold mb-2">How It Works</h2>
          <p className="text-muted">Getting dental care has never been this simple.</p>
        </div>
        <div className="row g-4">
          {STEPS.map((step, index) => (
            <div className="col-md-4" key={step.title}>
              <div className="dhms-card dhms-card--hover p-4 h-100 text-center">
                <div
                  className="dhms-stat-icon mx-auto mb-3"
                  style={{ width: 56, height: 56, fontSize: '1.5rem', background: 'var(--dhms-primary-light)', color: 'var(--dhms-primary-dark)' }}
                >
                  <i className={`bi ${step.icon}`} />
                </div>
                <div className="text-muted small fw-semibold mb-1">STEP {index + 1}</div>
                <h3 className="h5 fw-semibold mb-2">{step.title}</h3>
                <p className="text-muted mb-0">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Find a doctor preview */}
      <section className="container py-5">
        <div className="d-flex flex-wrap justify-content-between align-items-end mb-4 gap-2">
          <div>
            <h2 className="h3 fw-bold mb-1">Meet Our Doctors</h2>
            <p className="text-muted mb-0">A preview of the dentists available to book with today.</p>
          </div>
          <Link to="/register" className="btn btn-outline-primary">
            View All Doctors
          </Link>
        </div>

        {isLoadingDoctors ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading</span>
            </div>
          </div>
        ) : doctorsError ? (
          <div className="alert alert-warning-subtle border border-warning-subtle">{doctorsError}</div>
        ) : featuredDoctors.length === 0 ? (
          <div className="dhms-card p-5 text-center text-muted">
            No doctors are listed yet. Please check back soon.
          </div>
        ) : (
          <div className="row g-3">
            {featuredDoctors.map((doctor) => (
              <div className="col-12 col-sm-6 col-lg-4" key={doctor.id}>
                <div className="dhms-card dhms-card--hover p-4 h-100">
                  <div className="d-flex align-items-center gap-3 mb-2">
                    <Avatar name={doctor.name} size="lg" />
                    <div>
                      <h3 className="h6 fw-semibold mb-1">Dr. {doctor.name}</h3>
                      <p className="text-muted small mb-0">{doctor.specialization}</p>
                    </div>
                  </div>
                  {doctor.experienceYears !== null && (
                    <p className="small text-muted mb-0">{doctor.experienceYears} years of experience</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="container pb-5">
        <div className="dhms-card p-5 text-center" style={{ background: 'var(--dhms-primary-light)' }}>
          <h2 className="h3 fw-bold mb-2">Ready to take care of your smile?</h2>
          <p className="text-muted mb-4">Create a free account and book your first appointment today.</p>
          <Link to="/register" className="dhms-btn-gradient btn btn-lg text-white d-inline-flex align-items-center gap-2 mx-auto" style={{ width: 'fit-content' }}>
            <i className="bi bi-person-plus" />
            Create Your Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-top py-4">
        <div className="container text-center text-muted small">
          &copy; {new Date().getFullYear()} DentiFlow. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export default Home;
