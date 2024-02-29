import { useEffect, useState } from 'react'

import EmptySate from './components/EmptyState'
import Footer from './components/Footer'
import Pagination from './components/Pagination'

const serverPort = 3001
const serverURL = `http://localhost:${serverPort}`

const CustomerApp = () => {
  const [name, setName] = useState('')
  const [customers, setCustomers] = useState([])
  const [customer, setCustomer] = useState(null)

  const [paginationInfo, setPaginationInfo] = useState(() => ({
    currentPage: 1,
    totalPages: 1,
    limit: parseInt(localStorage.getItem('paginationLimit'), 10) || 10,
  }))
  const [currentPage, setCurrentPage] = useState(1)

  const [sortCriteria, setSortCriteria] = useState('size')
  const [sortOrder, setSortOrder] = useState('desc')

  const [initialFetchDone, setInitialFetchDone] = useState(false)

  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')

  const [sizeFilter, setSizeFilter] = useState('')

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light')
  }

  const handleFilterChange = (e) => {
    setSizeFilter(e.target.value)
    setCurrentPage(1)
  }

  useEffect(() => {
    localStorage.setItem('theme', theme)
    document.body.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('paginationLimit', paginationInfo.limit.toString())
  }, [paginationInfo.limit])

  useEffect(() => {
    getCustomers(currentPage, paginationInfo.limit, sizeFilter)
  }, [currentPage, paginationInfo.limit, sizeFilter])

  async function getCustomers(page, limit, sizeFilter) {
    try {
      const response = await fetch(`${serverURL}/customers`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ page, limit, size: sizeFilter })
      })
      const jsonResponse = await response.json()
      const { customers, pageInfo } = jsonResponse

      setCustomers(customers)
      setPaginationInfo(prevState => ({ ...prevState, currentPage: pageInfo.currentPage, totalPages: pageInfo.totalPages }))
    } catch (error) {
      console.error(error)
    } finally {
      setInitialFetchDone(true)
    }
  }

  const sortCustomers = (criteria) => {
    if (sortCriteria === criteria) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortOrder('desc')
    }
    setSortCriteria(criteria)
  }

  const sortedCustomers = [...customers].sort((a, b) => {
    const order = sortOrder === 'asc' ? 1 : -1
    if (sortCriteria === 'size') {
      const mapSizeToNumber = (size) => {
        switch (size.toLowerCase()) {
          case 'small': return 1
          case 'medium': return 2
          case 'big': return 3
          default: return 0
        }
      }
      return order * (mapSizeToNumber(a[sortCriteria]) - mapSizeToNumber(b[sortCriteria]))
    }
    return order * (a[sortCriteria] - b[sortCriteria])
  })

  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value, 10)
    setPaginationInfo(prevState => ({ ...prevState, limit: newLimit }))
    setCurrentPage(1)
  }

  const handlePaginationPrevClick = () =>
    setCurrentPage(prev => Math.max(prev - 1, 1))
  const handlePaginationNextClick = () =>
    setCurrentPage(prev => (prev < paginationInfo.totalPages ? prev + 1 : prev))

  return (
    <div className="container">
      <div className="header-container">
        <h1>EngageSphere</h1>
        <div className="theme-toggle-container">
          <button id="theme-toggle-button" onClick={toggleTheme} aria-labelledby="theme-toggle-label" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            {theme === 'light' ? '☽' : '☀'}
          </button>
        </div>
      </div>
      <div className="input-container">
        <input
          autoFocus
          type="text"
          id="name"
          data-testid="name"
          placeholder="Enter your name"
          onChange={(e) => setName(e.target.value)}
          disabled={customer || !customers.length ? true : false}
        />
      </div>
      {!customer ? (
        <div className="filter-container">
          <label htmlFor="sizeFilter">Filter by size:</label>
          <select data-testid="filter" id="sizeFilter" value={sizeFilter} onChange={handleFilterChange}>
            <option value="">All</option>
            <option value="Small">Small</option>
            <option value="Medium">Medium</option>
            <option value="Big">Big</option>
          </select>
        </div>
      ) : (
        null
      )}
      {customer ? (
        <div className="customer-details">
          <h2>Customer Details</h2>
          <p><strong>Company name:</strong> {customer.name}</p>
          <p><strong>Number of employees:</strong> {customer.employees}</p>
          <p><strong>Size:</strong> {customer.size}</p>
          {customer.contactInfo ? (
            <>
              <p><strong>Contact name:</strong> {customer.contactInfo.name}</p>
              <p><strong>Contact email:</strong> {customer.contactInfo.email}</p>
            </>
          ) : (
            <p>No contact info available</p>
          )}
          <div className="button-container">
            <button onClick={() => setCustomer(null)}>Back</button>
          </div>
        </div>
      ) : (
        <div data-testid="table" className="table-container">
          {initialFetchDone && !customers.length ? (
            <EmptySate />
          ) : customers.length ? (
            <>
              <p>Hi <b>{name ? name : 'there'}</b>! It is now <b>{(new Date()).toDateString()}</b>.</p>
              <div>
                <p>Below is our customer list.</p>
                <p>Click on each of them to view their contact details.</p>
                <table border="1">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Company name</th>
                      <th onClick={() => sortCustomers('employees')}>
                        Number of employees {sortCriteria === 'employees' && (sortOrder === 'asc' ? <span>&uarr;</span> : <span>&darr;</span>)}
                      </th>
                      <th onClick={() => sortCustomers('size')}>
                        Size {sortCriteria === 'size' && (sortOrder === 'asc' ? <span>&uarr;</span> : <span>&darr;</span>)}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedCustomers.map((customer) => (
                      <tr key={customer.id} onClick={() => setCustomer(customer)}>
                        <td>{customer.id}</td>
                        <td>{customer.name}</td>
                        <td>{customer.employees}</td>
                        <td>{customer.size}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Pagination
                  currentPage={currentPage}
                  paginationInfo={paginationInfo}
                  onClickPrev={handlePaginationPrevClick}
                  onClickNext={handlePaginationNextClick}
                  onChange={handleLimitChange}
                 />
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  )
}

const App = () => (
  <div>
    <CustomerApp />
    <Footer />
  </div>
)

export default App
