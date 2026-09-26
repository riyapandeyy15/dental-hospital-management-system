import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import DoctorLayout from '../../layouts/DoctorLayout.jsx';
import PageHeader from '../../components/shared/PageHeader.jsx';
import SearchBar from '../../components/shared/SearchBar.jsx';
import Avatar from '../../components/shared/Avatar.jsx';
import LoadingState from '../../components/shared/LoadingState.jsx';
import EmptyState from '../../components/shared/EmptyState.jsx';
import * as doctorPortalService from '../../api/doctorPortalService.js';

const PAGE_SIZE = 10;

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function calculateAge(dob) {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

function DoctorPatients() {
  const [patients, setPatients] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const loadPatients = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const result = await doctorPortalService.listPatients({ search, page, limit: PAGE_SIZE });
      setPatients(result.patients);
      setPagination(result.pagination);
    } catch (err) {
      if (err.request && !err.response) {
        setLoadError('Could not reach the server. Please check your connection and try again.');
      } else {
        setLoadError(err.response?.data?.message || 'Failed to load patients.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    const timeout = setTimeout(loadPatients, 300);
    return () => clearTimeout(timeout);
  }, [loadPatients]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  return (
    <DoctorLayout title="My Patients" subtitle="Patients you have appointments with.">
      <PageHeader title="My Patients" subtitle={`${pagination.total} patient${pagination.total === 1 ? '' : 's'}`} />

      <div className="dhms-card mb-4 p-3 p-md-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by name, phone or email" ariaLabel="Search patients" />
      </div>

      <div className="dhms-card">
        <div className="p-0">
          {isLoading ? (
            <LoadingState message="Loading patients..." />
          ) : loadError ? (
            <div className="p-4">
              <div className="alert alert-danger d-flex align-items-start gap-2 mb-3" role="alert">
                <i className="bi bi-exclamation-triangle-fill mt-1" />
                <div>{loadError}</div>
              </div>
              <button className="btn btn-outline-secondary btn-sm" type="button" onClick={loadPatients}>
                <i className="bi bi-arrow-clockwise me-1" />
                Retry
              </button>
            </div>
          ) : patients.length === 0 ? (
            <EmptyState
              icon="bi-people"
              title="No patients found"
              message={search ? 'Try a different search term.' : 'Patients will appear here once you have appointments with them.'}
            />
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 dhms-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Age / Gender</th>
                    <th>Phone</th>
                    <th>Last Appointment</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((patient) => {
                    const age = calculateAge(patient.dateOfBirth);
                    return (
                      <tr key={patient.id}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <Avatar name={patient.name} />
                            <div className="fw-medium">{patient.name}</div>
                          </div>
                        </td>
                        <td>
                          {age !== null ? `${age} yrs` : '—'}
                          {patient.gender ? ` · ${patient.gender.charAt(0).toUpperCase()}${patient.gender.slice(1)}` : ''}
                        </td>
                        <td>{patient.phone}</td>
                        <td>{formatDate(patient.lastAppointmentDate)}</td>
                        <td>
                          <span className={`dhms-badge ${patient.isActive ? 'dhms-badge-success' : 'dhms-badge-danger'}`}>
                            <span className="dhms-badge-dot" />
                            {patient.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="text-end">
                          <Link
                            to={`/doctor/patients/${patient.id}`}
                            className="btn btn-outline-secondary btn-sm"
                            title="View patient"
                            aria-label={`View details for ${patient.name}`}
                          >
                            <i className="bi bi-eye" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {!isLoading && !loadError && pagination.totalPages > 1 && (
          <div className="d-flex justify-content-between align-items-center border-top p-3">
            <span className="text-muted small">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <div className="btn-group btn-group-sm">
              <button className="btn btn-outline-secondary" type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(p - 1, 1))}>
                <i className="bi bi-chevron-left" />
                Previous
              </button>
              <button
                className="btn btn-outline-secondary"
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <i className="bi bi-chevron-right" />
              </button>
            </div>
          </div>
        )}
      </div>
    </DoctorLayout>
  );
}

export default DoctorPatients;
