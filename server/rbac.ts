import type { Request, Response, NextFunction } from 'express'
import { eq } from 'drizzle-orm'
import { users } from '@shared/schema'
import { db } from './storage'
import { ForbiddenError, UnauthorizedError } from './error-handler'
import { AuthenticatedRequest } from './jwt-middleware'

export type UserRole = 'user' | 'carrier' | 'admin'
export type Permission = 
  | 'view_dashboard'
  | 'manage_users'
  | 'manage_parcels'
  | 'manage_routes'
  | 'manage_payments'
  | 'manage_disputes'
  | 'manage_subscriptions'
  | 'view_analytics'
  | 'view_reports'

// Role-based permissions mapping
const rolePermissions: Record<UserRole, Permission[]> = {
  user: [
    'view_dashboard',
  ],
  carrier: [
    'view_dashboard',
    'manage_routes',
  ],
  admin: [
    'view_dashboard',
    'manage_users',
    'manage_parcels',
    'manage_routes',
    'manage_payments',
    'manage_disputes',
    'manage_subscriptions',
    'view_analytics',
    'view_reports',
  ],
}

/**
 * Get permissions for a role
 */
export function getPermissions(role: UserRole): Permission[] {
  return rolePermissions[role] || []
}

/**
 * Check if user has permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return getPermissions(role).includes(permission)
}

/**
 * Require specific permission middleware
 */
export function requirePermission(...permissions: Permission[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required')
    }

    try {
      // Fetch user with role
      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.id, req.user.userId))
        .limit(1)

      if (userResult.length === 0) {
        throw new UnauthorizedError('User not found')
      }

      const user = userResult[0]
      const userRole = (user.role as UserRole) || 'user'

      // Check if user has any of the required permissions
      const hasRequiredPermission = permissions.some(permission =>
        hasPermission(userRole, permission)
      )

      if (!hasRequiredPermission) {
        throw new ForbiddenError(
          `You don't have permission to access this resource. Required permissions: ${permissions.join(', ')}`
        )
      }

      // Attach user role to request for later use
      ;(req as any).userRole = userRole

      next()
    } catch (error) {
      next(error)
    }
  }
}

/**
 * Require specific role(s)
 */
export function requireRole(...roles: UserRole[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required')
    }

    try {
      // Fetch user with role
      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.id, req.user.userId))
        .limit(1)

      if (userResult.length === 0) {
        throw new UnauthorizedError('User not found')
      }

      const user = userResult[0]
      const userRole = (user.role as UserRole) || 'user'

      if (!roles.includes(userRole)) {
        throw new ForbiddenError(
          `This endpoint requires one of these roles: ${roles.join(', ')}`
        )
      }

      ;(req as any).userRole = userRole

      next()
    } catch (error) {
      next(error)
    }
  }
}

/**
 * Get user role from request
 */
export function getUserRole(req: AuthenticatedRequest): UserRole {
  return (req as any).userRole || 'user'
}

/**
 * Check if user is admin
 */
export function isAdmin(req: AuthenticatedRequest): boolean {
  return getUserRole(req) === 'admin'
}

/**
 * Check if user is carrier
 */
export function isCarrier(req: AuthenticatedRequest): boolean {
  return getUserRole(req) === 'carrier'
}
