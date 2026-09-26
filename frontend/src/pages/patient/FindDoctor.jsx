import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import PatientLayout from '../../layouts/PatientLayout.jsx';
import PageHeader from '../../components/shared/PageHeader.jsx';
import SearchBar from '../../components/shared/SearchBar.jsx';
import Avatar from '../../components/shared/Avatar.jsx';
import LoadingState from '../../components/shared/LoadingState.jsx';
import EmptyState from '../../components/shared/EmptyState.jsx';
import * as publicDoctorService from '../../api/publicDoctorService.js';

const PAGE_SIZE = 9;

function FindDoctor() {
  const [doctors, setDoctors] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [search, setSearch] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const result = await publicDoctorService.listPublicDoctors({ search, specialization, page, limit: PAGE_SIZE });
      setDoctors(result.doctors);
      setPagination(result.pagination);
    } catch (err) {
      if (err.request && !err.response) {
        setLoadError('Could not reach the server. Please check your connection and try again.');
      } else {
        setLoadError(err.response?.data?.message || 'Failed to load doctors.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [search, specialization, page]);

  useEffect(() => {
    const timeout = setTimeout(load, 300);
    return () => clearTimeout(timeout);
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search, specialization]);

  const specializations = [...new Set(doctors.map((d) => d.specialization))].sort();

  return (
    <PatientLayout title="Find a Doctor" subtitle="Browse doctors and book an appointment.">
      <PageHeader title="Find a Doctor" subtitle={`${pagination.total} doctor${pagination.total === 1 ? '' : 's'} available`} />

      <div className="dhms-card mb-4 p-3 p-md-4">
        <div className="row g-3">
          <div className="col-12 col-md-8">
            <SearchBar value={search} onChange={setSearch} placeholder="Search by name or specialization" ariaLabel="Search doctors" />
          </div>
          <div className="col-12 col-md-4">
            <select
              className="form-select"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              aria-label="Filter by specialization"
            >
              <option value="">All specializations</option>
              {specializations.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingState message="Loading doctors..." />
      ) : loadError ? (
        <div className="dhms-card p-4">
          <div className="alert alert-danger d-flex align-items-start gap-2 mb-3" role="alert">
            <i className="bi bi-exclamation-triangle-fill mt-1" />
            <div>{loadError}</div>
          </div>
          <button className="btn btn-outline-secondary btn-sm" type="button" onClick={load}>
            <i className="bi bi-arrow-clockwise me-1" />
            Retry
          </button>
        </div>
      ) : doctors.length === 0 ? (
        <div className="dhms-card">
          <EmptyState icon="bi-search-heart" title="No doctors found" message="Try a different search term or specialization." />
        </div>
      ) : (
        <>
          <div className="row g-3 mb-4">
            {doctors.map((doctor) => (
              <div className="col-12 col-sm-6 col-lg-4" key={doctor.id}>
                <div className="dhms-card dhms-card--hover p-4 h-100 d-flex flex-column">
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <Avatar name={doctor.name} size="lg" />
                    <div>
                      <h3 className="h6 fw-semibold mb-1">Dr. {doctor.name}</h3>
                      <p className="text-muted small mb-0">{doctor.specialization}</p>
                    </div>
                  </div>

                  {doctor.qualifications?.length > 0 && (
                    <p className="text-muted small mb-2">{doctor.qualifications.join(', ')}</p>
                  )}
                  {doctor.experienceYears !== null && (
                    <p className="small mb-3">
                      <i className="bi bi-briefcase me-1 text-muted" />
                      {doctor.experienceYears} years of experience
                    </p>
                  )}

                  <span className="dhms-badge dhms-badge-success mb-3 align-self-start">
                    <span className="dhms-badge-dot" />
                    {doctor.availability?.length > 0 ? 'Accepting appointments' : 'Schedule not yet set'}
                  </span>

                  <Link to={`/patient/doctors/${doctor.id}`} className="btn btn-primary mt-auto d-inline-flex align-items-center justify-content-center gap-2">
                    <i className="bi bi-calendar-plus" />
                    View Profile &amp; Book
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="d-flex justify-content-center gap-2">
              <button
                className="btn btn-outline-secondary btn-sm"
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
              >
                <i className="bi bi-chevron-left" />
                Previous
              </button>
              <span className="text-muted small align-self-center">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                className="btn btn-outline-secondary btn-sm"
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <i className="bi bi-chevron-right" />
              </button>
            </div>
          )}
        </>
      )}
    </PatientLayout>
  );
}

export default FindDoctor;
