"use client"
import React, { useContext, useEffect, useRef, useState } from 'react';
import { SearchOutlined } from '@ant-design/icons';
import { GetRef, InputRef, TableColumnType, Typography, Image, Avatar } from 'antd';
import type { FilterDropdownProps } from 'antd/es/table/interface';
import { Button, Form, Input, Popconfirm, Table, Space } from 'antd';
import useData from './data';
import './index.css';
import AddColButton from '../add-col-button';

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
    pageParams, setPageParams, updateColName, 
    total, refetch } = useData()

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
      width: 100,
      fixed: 'left',
      sorter: true,
      sortOrder: pageParams.sorter.order
    },
    {
      title: 'name',
      dataIndex: 'name',
      editable: true,
      ...getColumnSearchProps('name')
    },
    {
      title: 'domain',
      dataIndex: 'domain',
      editable: true,
      ...getColumnSearchProps('domain')
    },
    {
      title: 'url',
      dataIndex: 'url',
      editable: true,
    },
    {
      title: 'operation',
      dataIndex: 'operation',
      fixed: 'right',
      render: (_: any, record: any) =>
        companies?.length >= 1 ? (
          <Popconfirm okButtonProps={{
            type: 'dashed'
          }} title="Sure to delete?" onConfirm={() => handleDelete(record.id)}>
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
    await editCompany({...row})
  };

  const components = {
    body: {
      row: EditableRow,
      cell: EditableCell,
    },
  };


  const getColumns = () => {
    if(!companies[0]) return []
    const keys = Object.keys(companies[0])
    const addedCols = keys.slice(4).map((key: string) => (
      {
        title: key,
        dataIndex: key,
        editable: true,
      }
    ))
    const newColumns = [...defaultColumns.slice(0, 4)
      , ...addedCols
      , defaultColumns[defaultColumns.length - 1]]
    
    return newColumns.map((col) => {
      if (!(col as any).editable) {
        return col;
      }
      const { title } = col
      const titleStr = String(title)
      const isEditCol = ['domain', 'name', 'url'].includes(titleStr)
      const isImgType = (titleStr).includes('(img)')
      const endOfImgTag = 5
      const imgTitle = isImgType ? 
      titleStr.slice(0, titleStr.length - endOfImgTag) : titleStr

      return {
        ...col,
        title: (
          isEditCol ? title : 
          <>
          <Typography.Text 
            editable={{ onChange: (val) => 
              {
                const newName = isImgType ? val + '(img)' : val
                updateColName(titleStr, newName)
              }}}>
            {imgTitle}
          </Typography.Text> {isImgType && '(img)'}
          </>
          ),
        render: (val: string | undefined) => {
          if(!isImgType) {
            return <p>{val}</p>
          } else {
            if(val) {
              return <Avatar
                      src={val} 
                      // alt="invalid url" 
                      onError= {() => false}
                    /> 
            } else {
              return <p>To input img url</p>
            }
          }
        },
        onCell: (record: DataType) => ({
          record,
          editable: (col as any).editable,
          dataIndex: col.dataIndex,
          handleSave,
        })
      };
    });
  }


  return (
    <div>
      <Button onClick={handleAdd} 
              className='bg-btn-background'
              style={{ marginBottom: 16 }}>
        + Add row
      </Button>
      <AddColButton refetch ={refetch}/>
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
        style={{width: 900}}
        rowKey={'id'}
        dataSource={companies}
        columns={getColumns() as ColumnTypes}
        loading={loading}
        scroll={{ x: 1500 }}
        onChange={(pagination, filter, sorter) => {
          const { current, pageSize } = pagination
          setPageParams({current, pageSize, sorter, filter})
        }}
      />
    </div>
  );
};

export default DynamicTable;
