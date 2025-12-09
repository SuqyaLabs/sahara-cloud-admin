export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          name: string
          slug: string
          status: 'trial' | 'active' | 'suspended' | 'cancelled'
          config: Json | null
          owner_email: string | null
          owner_phone: string | null
          business_name: string | null
          business_address: string | null
          tax_id: string | null
          trial_ends_at: string | null
          activated_at: string | null
          suspended_at: string | null
          cancelled_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['tenants']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['tenants']['Insert']>
      }
      tenant_owners: {
        Row: {
          id: string
          tenant_id: string
          user_id: string
          role: 'owner' | 'manager' | 'viewer'
          permissions: Json
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['tenant_owners']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['tenant_owners']['Insert']>
      }
      orders: {
        Row: {
          id: string
          pb_id: string | null
          tenant_id: string
          order_number: string
          status: 'draft' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'void'
          type: 'dine_in' | 'takeaway' | 'delivery'
          table_id: string | null
          customer_id: string | null
          shift_id: string | null
          total_gross: number
          discount_amount: number
          discount_type: string | null
          discount_reason: string | null
          waiter_name: string | null
          note: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['orders']['Insert']>
      }
      order_lines: {
        Row: {
          id: string
          pb_id: string | null
          tenant_id: string
          order_id: string
          product_id: string | null
          variant_id: string | null
          qty: number
          unit_price: number
          status: string
          modifiers: Json | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['order_lines']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['order_lines']['Insert']>
      }
      products: {
        Row: {
          id: string
          pb_id: string | null
          tenant_id: string
          name: string
          price: number
          category_id: string | null
          is_active: boolean
          is_available: boolean
          description: string | null
          image: string | null
          preparation_station: 'kitchen' | 'bar' | 'oven' | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['products']['Insert']>
      }
      categories: {
        Row: {
          id: string
          pb_id: string | null
          tenant_id: string
          name: string
          type: 'retail' | 'hospitality' | 'service'
          parent_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['categories']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['categories']['Insert']>
      }
      payments: {
        Row: {
          id: string
          pb_id: string | null
          tenant_id: string
          order_id: string
          shift_id: string | null
          method: 'cash' | 'cib_card' | 'edahabia' | 'check' | 'qr'
          amount: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['payments']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['payments']['Insert']>
      }
      shifts: {
        Row: {
          id: string
          pb_id: string | null
          tenant_id: string
          user_id: string | null
          opening_cash: number
          closing_cash: number | null
          status: 'open' | 'closed'
          opened_at: string
          closed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['shifts']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['shifts']['Insert']>
      }
      customers: {
        Row: {
          id: string
          pb_id: string | null
          tenant_id: string
          name: string
          phone: string
          balance: number
          loyalty_points: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['customers']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['customers']['Insert']>
      }
    }
    Views: {
      v_daily_sales: {
        Row: {
          tenant_id: string
          date: string
          order_count: number
          completed_count: number
          pending_count: number
          cancelled_count: number
          total_revenue: number
          completed_revenue: number
          total_discount: number
          avg_order_value: number
        }
      }
      v_hourly_sales: {
        Row: {
          tenant_id: string
          date: string
          hour: number
          order_count: number
          revenue: number
        }
      }
      v_product_performance: {
        Row: {
          tenant_id: string
          product_id: string
          product_pb_id: string | null
          name: string
          price: number
          category_name: string | null
          times_sold: number
          total_quantity: number
          total_revenue: number
        }
      }
      v_payment_breakdown: {
        Row: {
          tenant_id: string
          date: string
          method: string
          payment_count: number
          total_amount: number
        }
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Convenience types
export type Tenant = Database['public']['Tables']['tenants']['Row']
export type TenantOwner = Database['public']['Tables']['tenant_owners']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type OrderLine = Database['public']['Tables']['order_lines']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Payment = Database['public']['Tables']['payments']['Row']
export type Shift = Database['public']['Tables']['shifts']['Row']
export type Customer = Database['public']['Tables']['customers']['Row']

export type DailySales = Database['public']['Views']['v_daily_sales']['Row']
export type HourlySales = Database['public']['Views']['v_hourly_sales']['Row']
export type ProductPerformance = Database['public']['Views']['v_product_performance']['Row']
export type PaymentBreakdown = Database['public']['Views']['v_payment_breakdown']['Row']
