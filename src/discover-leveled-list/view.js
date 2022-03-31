
import '@servicenow/now-button'
import '@servicenow/now-dropdown'
import '@servicenow/now-heading'
import '@servicenow/now-icon'
import '@servicenow/now-highlighted-value'
import '@servicenow/now-pagination-control'

import { Fragment } from '@servicenow/ui-renderer-snabbdom'

const view = (state, { updateState, dispatch }) => {
  const { properties } = state
  updateState({ data: [...properties.data] })
  const data = state.data
  const fields = properties.fields.length
    ? properties.fields.indexOf(',') > -1
        ? properties.fields.split(',').map(field => field.toLowerCase())
        : [properties.fields]
    : []
  const relatedFields = properties.relatedFields.length
    ? properties.relatedFields.indexOf(',') > -1
        ? properties.relatedFields.split(',').map(field => field.toLowerCase())
        : [properties.relatedFields]
    : []
  const actionItems = properties.actionItems
  const relatedActionItems = properties.relatedActionItems

  /**
   * clicked when the related child trigger is selected and sets the record to state
   * @function
   * @param {*} record
   */
  function childTableClicked (record) {
    updateState({
      path: 'selectedChild',
      value: record,
      operation: 'set'
    })
  }

  /**
   * function to set state to a selected prop by the user
   * @function
   * @param {*} prop prop value to sort on
   */
  function setSelectedSort (prop) {
    const selectedSort = state.selectedSort
    const value = selectedSort.key === prop
      ? selectedSort.asc === true
          ? { key: prop, asc: false }
          : { key: prop, asc: true }
      : { key: prop, asc: true }
    updateState({
      path: 'selectedSort',
      value: value,
      operation: 'set'
    })
  }

  /**
   * function to set the state to a parent record when clicked
   * and to expand the related collapsed table
   * @param {*} record record object that was clicked
   */
  function parentRecordClicked (record) {
    updateState({
      path: 'selected',
      value: record,
      operation: 'set'
    })
    if (record._expanded) {
      record._expanded = false
    } else {
      record._expanded = true
      if (!record._related) {
        record._related = []
        dispatch('DIS_RELATED_REQUESTED', { record })
      }
    }
  }

  /**
   * function to update state with an array of checked parent records for batch actions
   * @param {*} record
   */
  function recordSelected (record) {
    const recordSysID = record.sys_id.value
    const selectedParent = state.selectedParent
    /* eslint-disable-next-line  camelcase */
    const recordExists = selectedParent.findIndex(({ sys_id }) => sys_id === recordSysID)
    if (recordExists > -1) {
      updateState({
        path: 'selectedParent',
        value: { sys_id: recordSysID },
        operation: 'splice',
        start: recordExists,
        deleteCount: 1
      })
    } else {
      updateState({
        path: 'selectedParent',
        value: { sys_id: recordSysID },
        operation: 'push'
      })
    }
  }

  /**
   * function that updates the state with checked related records for batch actions
   * @param {*} parentRecord the parent record of the related items selected
   * @param {*} relatedRecord the related record the user selected
   */
  function relatedRecordSelected (parentRecord, relatedRecord) {
    const recordSysID = parentRecord.sys_id.value
    const relatedSysID = relatedRecord.sys_id
    const selectedRelated = state.selectedRelated
    const relatedChildKey = properties.relatedChildKey
    const relatedParentKey = properties.relatedParentKey

    const recordExists = selectedRelated.findIndex((element) => element[relatedChildKey] === relatedSysID && element[relatedParentKey] === recordSysID)
    if (recordExists > -1) {
      updateState({
        path: 'selectedRelated',
        value: {
          [relatedParentKey]: recordSysID,
          [relatedChildKey]: relatedSysID
        },
        operation: 'splice',
        start: recordExists,
        deleteCount: 1
      })
    } else {
      updateState({
        path: 'selectedRelated',
        value: {
          [relatedParentKey]: recordSysID,
          [relatedChildKey]: relatedSysID
        },
        operation: 'push'
      })
    }
  }

  const debugBar = properties.debugMode
    ? (
      <div>
        {JSON.stringify(state.selectedParent)}<br />
        {JSON.stringify(state.selectedRelated)}<br />
      </div>
      )
    : <div />

  const tHead = data.length
    ? Object.keys(data[0])
        .filter(prop => fields.length ? fields.includes(prop.toLowerCase()) : true)
        .map((prop, i) => {
          return (
            <th key={i}>
              <div>
                <a className='col-header list-pointer' on-click={() => setSelectedSort(prop)}>
                  <span>{data[0][prop].label}</span>
                  <now-icon icon={state.selectedSort.key === prop ? state.selectedSort.asc ? 'caret-down-fill' : 'caret-up-fill' : 'list-marker-fill'} />
                </a>
              </div>
            </th>
          )
        })
    : <span />

  const sortKey = state.selectedSort.key ? state.selectedSort.key : Object.keys(data[0])[0]

  const tBody = data.length
    ? data
        .sort((a, b) => {
          return state.selectedSort.asc === true
            ? a[sortKey].value > b[sortKey].value
                ? 1
                : -1
            : a[sortKey].value > b[sortKey].value
              ? -1
              : 1
        })
        .slice(state.selectedPage * state.selectedPageSize, (state.selectedPage + 1) * state.selectedPageSize)
        .map((record, i) => {
          const dataCells = Object.keys(record)
            .filter(prop => fields.length ? fields.includes(prop.toLowerCase()) : true)
            .map((prop, ix) => {
              return ix === 0
                ? (
                  <td key={ix}>
                    <a
                      className='event-link list-pointer' on-click={e => {
                        return dispatch(
                          'LEVELED_LIST_ROW_CLICKED',
                          {
                            event: e,
                            record: record,
                            table: properties.table
                          })
                      }}
                    >{record[prop].displayValue}
                    </a>
                  </td>
                  )
                : <td key={ix}>{record[prop].displayValue}</td>
            })

          const relatedTrigger = relatedActionItems.length
            ? (
              <now-dropdown-custom-target items={relatedActionItems}>
                <now-button-iconic
                  on-click={() => childTableClicked(record)}
                  icon='ellipsis-h-fill' variant='tertiary' slot='trigger'
                  size='md' config-aria={{ button: { 'aria-label': 'Related Actions' } }} tooltip-content='Related Actions'
                />
              </now-dropdown-custom-target>
              )
            : <span />

          const relatedHeadersMap = (prop, i) => <th key={i}>{prop.toUpperCase()}</th>

          const relatedHeaders = record._related && record._related.length
            ? (
              <tr>
                <th className='col-control text-center'>
                  {relatedTrigger}
                </th>
                {relatedFields.length
                  ? relatedFields
                      .map(relatedHeadersMap)
                  : Object.keys(record._related[0])
                    .map(relatedHeadersMap)}
              </tr>
              )
            : (
              <Fragment>
                <tr>
                  <th className='col-control text-center'>
                    {relatedTrigger}
                  </th>
                  {relatedFields.map(relatedHeadersMap)}
                </tr>
                <tr>
                  <td />
                  {relatedFields.map((prop, i) => <td key={i} />)}
                </tr>
              </Fragment>
              )

          const relatedDataRows = record._related && record._related.length
            ? record._related.map((relatedRecord, i) => {
                const relatedDataCells = relatedFields.length
                  ? relatedFields
                      .map((prop, ix) => {
                        return ix === 0
                          ? (
                            <td key={ix}>
                              <a
                                className='event-link list-pointer' on-click={e => {
                                  return dispatch(
                                    'LEVELED_LIST_ROW_CLICKED',
                                    {
                                      event: e,
                                      record: relatedRecord,
                                      table: properties.relatedTable
                                    })
                                }}
                              >{relatedRecord[prop]}
                              </a>
                            </td>
                            )
                          : <td key={ix}>{relatedRecord[prop]}</td>
                      })
                  : Object.keys(relatedRecord)
                    .map((prop, ix) => <td key={ix}>{relatedRecord[prop]}</td>)
                return (
                  <tr key={i}>
                    <td className='col-control text-center'>
                      {relatedActionItems.length
                        ? <input type='checkbox' on-click={() => relatedRecordSelected(record, relatedRecord)} />
                        : <span />}
                    </td>
                    {relatedDataCells}
                  </tr>
                )
              })
            : <span />

          const relatedExpanded = record._expanded
            ? (
              <Fragment>
                <tbody>
                  <tr>
                    <th colspan='100%' className='related-heading-container'>
                      <h3 className='related-heading d-inline-block now-heading -header -tertiary m-y-0'><span class='now-line-height-crop'>{properties.relatedTableTitle || properties.relatedChildKey}</span></h3>
                      <span className='related-highlighted-count'>{record._related.length ? record._related.length : '0'}</span>
                    </th>
                  </tr>
                </tbody>
                <tbody className='related-body'>
                  {relatedHeaders}
                  {relatedDataRows}
                </tbody>
                <tbody className='b-0'>
                  <tr colspan='100%'>
                    <td className='b-0' />
                  </tr>
                </tbody>
              </Fragment>
              )
            : <span />

          return (
            <Fragment key={i}>
              <tbody className={record._expanded ? 'selected-list-record' : ''}>
                <tr>
                  <td className='col-control text-center'>
                    {actionItems.length
                      ? <input type='checkbox' on-click={() => recordSelected(record)} />
                      : <span />}
                    <now-button-iconic
                      className='m-5'
                      on-click={() => parentRecordClicked(record)}
                      icon={record._expanded ? 'caret-down-fill' : 'caret-right-fill'} variant='tertiary' slot='trigger'
                      size='md' config-aria={{ button: { 'aria-label': 'Related Actions' } }} tooltip-content='Related Actions'
                    />
                  </td>
                  {dataCells}
                </tr>
              </tbody>
              {relatedExpanded}
            </Fragment>
          )
        })
    : <span />

  return (
    <div className='main'>
      <table className='table table-striped table-hover'>
        <thead>
          <tr>
            <th className='col-control text-center'>
              <now-dropdown-custom-target items={actionItems}>
                <now-button-iconic
                  icon='ellipsis-h-fill' variant='tertiary' slot='trigger'
                  size='md' config-aria={{ button: { 'aria-label': 'Primary Actions' } }} tooltip-content='Primary Actions'
                />
              </now-dropdown-custom-target>
            </th>
            {tHead}
          </tr>
        </thead>
        {tBody}
      </table>
      <div><now-pagination-control total={state.data.length} selectedPage={state.selectedPage} selectedPageSize={state.selectedPageSize} /></div>
      {debugBar}
    </div>
  )
}

export { view }
