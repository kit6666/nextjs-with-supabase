import { useEffect, useState } from "react";
import { supabase } from "../../api";
import { Domain } from "domain";

interface PageParams {
  current?: number
  pageSize?: number
  sorter?: any
  // {
  //   field: string,
  //   order: 'ascend' | 'descend'
  // }
  filter?: any
}

interface Company {
  id?: number
  domain?: string
  name?: string
  url?: string
}

const useData = () => {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageParams, setPageParams] = useState<PageParams>
  (
    {
      current: 1, 
      pageSize: 10, 
      sorter: {
        field: 'id',
        order: 'ascend'
      }
    }
  )
  const [total, setTotal] = useState<number | null>(0)

  useEffect(() => {
    fetchCompanies(pageParams);
    getTotal(pageParams)

    const mySubscription = supabase
      .channel('table-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'companies'
        }, () => fetchCompanies(pageParams))
      .subscribe()
    // return () => supabase.removeChannel()
  }, [pageParams]);

  const fetchCompanies = async (pageParams: PageParams) => {
    try {
      const {current: page, pageSize, sorter, filter} = pageParams
      const filterField = filter && Object.keys(filter)[0] 
      const filterVal = filter &&  Object.values(filter)[0]

      if(!page || !pageSize) return ;
      setLoading(true);
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .order(sorter.field, {
          ascending: sorter?.order !== 'descend'
        })
        .like(filterField || 'domain', filterVal ? `%${filterVal}%` : '%')
        .range((page - 1) * pageSize, page * pageSize - 1)
      if (error) throw error;
      setCompanies(data);
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const createCompany = async (info: Company) => {
    const{ domain, name, url } = info
    const { data, error } = await supabase
      .from('companies')
      .insert([
        {
          domain,
          name,
          url
        }
      ])
      .single()

    await fetchCompanies(pageParams)
  }

  const editCompany = async (info: Company) => {
    const{ id, domain, name, url } = info
    const { data, error } = await supabase
      .from('companies')
      .update([
        {
          domain,
          name,
          url
        }
      ])
      .match({id})

    await fetchCompanies(pageParams)
  }

  const deleteCompany = async (id: number) => {
    const { data, error } = await supabase
      .from('companies')
      .delete()
      .match({ id })
    
    await fetchCompanies(pageParams)
  }

  const getTotal = async (pageParams: PageParams) => {
    const {filter} = pageParams
    const filterField = filter && Object.keys(filter)[0] 
    const filterVal = filter &&  Object.values(filter)[0]

    const {count} = await supabase
    .from('companies')
    .select('*', {count: 'exact'})
    .like(filterField || 'domain', filterVal ? `%${filterVal}%` : '%')

    console.log('count', count)
    setTotal(count)
  }

  console.log('companies', companies)
  return { companies, setCompanies, fetchCompanies, 
    createCompany, editCompany, deleteCompany, pageParams, 
    setPageParams, total, loading }
}

export default useData

