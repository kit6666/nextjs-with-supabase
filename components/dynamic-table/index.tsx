"use client"
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { SearchOutlined } from '@ant-design/icons';
import type { GetRef, InputRef, TableColumnType, TableProps } from 'antd';
import type { FilterDropdownProps } from 'antd/es/table/interface';
import { Button, Form, Input, Popconfirm, Table, Space } from 'antd';
import useData from './data';
import AddRowButton from '../add-row-button';
import './index.css';

type FormInstance<T> = GetRef<typeof Form<T>>;

const EditableContext = React.createContext<FormInstance<any> | null>(null);

interface Item {
  key: string;
  name: string;
  age: string;
  address: string;
}

interface EditableRowProps {
  index: number;
}

const EditableRow: React.FC<EditableRowProps> = ({ index, ...props }) => {
  const [form] = Form.useForm();
  return (
    <Form form={form} component={false}>
      <EditableContext.Provider value={form}>
        <tr {...props} />
      </EditableContext.Provider>
    </Form>
  );
};

interface EditableCellProps {
  title: React.ReactNode;
  editable: boolean;
  dataIndex: keyof Item;
  record: Item;
  handleSave: (record: Item) => void;
}

const EditableCell: React.FC<React.PropsWithChildren<EditableCellProps>> = ({
  title,
  editable,
  children,
  dataIndex,
  record,
  handleSave,
  ...restProps
}) => {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<InputRef>(null);
  const form = useContext(EditableContext)!;

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
    }
  }, [editing]);

  const toggleEdit = () => {
    setEditing(!editing);
    form.setFieldsValue({ [dataIndex]: record[dataIndex] });
  };

  const save = async () => {
    try {
      const values = await form.validateFields();

      toggleEdit();
      handleSave({ ...record, ...values });
    } catch (errInfo) {
      console.log('Save failed:', errInfo);
    }
  };

  let childNode = children;

  if (editable) {
    childNode = editing ? (
      <Form.Item
        style={{ margin: 0 }}
        name={dataIndex}
        rules={[
          {
            required: true,
            message: `${title} is required.`,
          },
        ]}
      >
        <Input ref={inputRef} onPressEnter={save} onBlur={save} />
      </Form.Item>
    ) : (
      <div className="editable-cell-value-wrap" style={{ paddingRight: 24 }} onClick={toggleEdit}>
        {children}
      </div>
    );
  }

  return <td {...restProps}>{childNode}</td>;
};

type EditableTableProps = Parameters<typeof Table>[0];

interface DataType {
  key: React.Key;
  name: string;
  id: number;
  url: string;
  domain: string;
}

type DataIndex = keyof DataType;

type ColumnTypes = Exclude<EditableTableProps['columns'], undefined>;

const DynamicTable: React.FC = () => {
  const { companies, createCompany, 
    editCompany, loading, deleteCompany, 
    pageParams, setPageParams, total } = useData()

  const [searchText, setSearchText] = useState('');
  const searchInput = useRef<InputRef>(null);

  const handleDelete = (id: number) => {
    deleteCompany(id)
  };

  const handleSearch = (
    selectedKeys: string[],
    confirm: FilterDropdownProps['confirm'],
    dataIndex: DataIndex,
  ) => {
    confirm();
    console.log('search', selectedKeys, dataIndex)
    setPageParams({...pageParams, filter: {
      [dataIndex]: selectedKeys[0]
    }})

    // setSearchText(selectedKeys[0]);
  };

  const handleReset = (clearFilters: () => void) => {
    clearFilters();
    setPageParams({...pageParams, filter: {}})
    // setSearchText('');
  };

  const getColumnSearchProps = (dataIndex: DataIndex): TableColumnType<DataType> => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          ref={searchInput}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            onClick={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button
            onClick={() => clearFilters && handleReset(clearFilters)}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              close();
            }}
          >
            close
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? '#1677ff' : undefined }} />
    ),
    onFilter: (value, record) =>
      record[dataIndex]
        .toString()
        .toLowerCase()
        .includes((value as string).toLowerCase()),
    onFilterDropdownOpenChange: (visible) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    }
  });


  const defaultColumns = [
    {
      title: 'id',
      dataIndex: 'id',
      width: '30%',
      sorter: true,
      // sortOrder: 'ascend',
      sortOrder: pageParams.sorter.order
    },
    {
      title: 'domain',
      dataIndex: 'domain',
      editable: true,
      ...getColumnSearchProps('domain')
    },
    {
      title: 'name',
      dataIndex: 'name',
      editable: true,
      ...getColumnSearchProps('name')
    },
    {
      title: 'operation',
      dataIndex: 'operation',
      render: (_: any, record: any) =>
        companies?.length >= 1 ? (
          <Popconfirm title="Sure to delete?" onConfirm={() => handleDelete(record.id)}>
            <a>Delete</a>
          </Popconfirm>
        ) : null,
    },
  ];

  const handleAdd = async () => {
    await createCompany({
      domain: '',
      name: '',
      url: ''
    })
  };

  const handleSave = async(row: DataType) => {
    console.log('record', row)
    const {id, domain, name, url} = row
    await editCompany({id, domain, name, url})
  };

  const components = {
    body: {
      row: EditableRow,
      cell: EditableCell,
    },
  };


  // const getColumns = () => {
  //   if(!companies[0]) return []
  //   const keys = Object.keys(companies[0])

  //   const newColumns = [defaultColumns[0]].concat(
  //     keys.slice(1).map((key) => (
  //     {
  //       title: key,
  //       dataIndex: key,
  //       editable: true,
  //     }
  //   ))).concat([defaultColumns[1]])
    
  //   return newColumns.map((col) => {
  //     if (!col.editable) {
  //       return col;
  //     }
  //     return {
  //       ...col,
  //       onCell: (record: DataType) => ({
  //         record,
  //         editable: col.editable,
  //         dataIndex: col.dataIndex,
  //         title: col.title,
  //         handleSave,
  //       }),
  //     };
  //   });
  // }


  const columns = defaultColumns.map((col) => {
    if (!(col as any).editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record: DataType) => ({
        record,
        editable: (col as any).editable,
        dataIndex: col.dataIndex,
        title: col.title,
        handleSave,
      }),
    };
  });

  return (
    <div>
      <Button onClick={handleAdd} style={{ marginBottom: 16 }}>
        + Add row
      </Button>
      <AddRowButton/>
      <Table
        components={components}
        rowClassName={() => 'editable-row'}
        bordered
        pagination={{
          total: total ? total : undefined, 
          current: pageParams.current, 
          pageSize: pageParams.pageSize,
          pageSizeOptions: [10, 20, 100],
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} items`
        }}
        rowKey={'id'}
        dataSource={companies}
        columns={columns as ColumnTypes}
        loading={loading}
        onChange={(pagination, filter, sorter) => {
          console.log('pages', pageParams, filter, sorter)
          const { current, pageSize } = pagination
          setPageParams({current, pageSize, sorter, filter})
        }}
      />
    </div>
  );
};

export default DynamicTable;
