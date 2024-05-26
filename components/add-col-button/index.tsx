import React, { useRef } from 'react';
import type { MenuProps } from 'antd';
import { Button, Dropdown, Space } from 'antd';
import { supabase } from "../../api";

const items: MenuProps['items'] = [
  {
    key: 'text',
    label: 'text',
  },
  {
    key: 'numeric',
    label: 'number'
  },
  {
    key: 'date',
    label: 'date'
  },
  {
    key: 'image',
    label: 'image'
  }
];

interface IAddColButton {
  refetch: () => {}
}

export default function AddColButton({refetch}: IAddColButton) {
  const newColref = useRef(0)

  const onClick: MenuProps['onClick'] = async ({ key }) => {
    console.log(`Click on item ${key}`);
    newColref.current = newColref.current + 1
    const count = newColref.current
    const {data , error} = await supabase
    .rpc('add_column', {
      schema_name_in: 'public', //optional defaults to public
      table_name_in: 'companies',//required name of the table
      column_name_in: `new column(${count})`,  //required: name for the column
      type_in: key,    //optional: defaults to text
      // is_array: false           //optional: defaults to false
    });

    console.log('re', refetch)
    refetch()
  };

  return (
    <Dropdown menu={{ items, onClick }} placement="bottomLeft">
        <Button style={{marginLeft: 8}}>+ Add column</Button>
    </Dropdown>
  );
}