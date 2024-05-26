import React from 'react';
import type { MenuProps } from 'antd';
import { Button, Dropdown, Space } from 'antd';
import { supabase } from "../../api";

const onClick: MenuProps['onClick'] = async ({ key }) => {
  console.log(`Click on item ${key}`);
  const {data , error} = await supabase
  .rpc('add_column', {
    schema_name_in: 'public', //optional defaults to public
    table_name_in: 'companies',//required name of the table
    column_name_in: 'new column',     //required: name for the column
    // type_in: 'NUMERIC',    //optional: defaults to text
    // is_array: false           //optional: defaults to false
  }); 
};

const items: MenuProps['items'] = [
  {
    key: 'text',
    label: 'text',
  },
  {
    key: 'number',
    label: 'number'
  },
  {
    key: 'date',
    label: 'date'
  },
  {
    key: 'images',
    label: 'images'
  }
];

export default function AddRowButton() {

  return (
    <Dropdown menu={{ items, onClick }} placement="bottomLeft">
        <Button style={{marginLeft: 8}}>+ Add column</Button>
    </Dropdown>
  );
}