use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("9WnqgSWY9UShGnspTmoTSgVJEHo7DNjWvpcSPbJHcKym");

#[program]
pub mod yesno {
    use super::*;

    pub fn initialize_market(
        ctx: Context<InitializeMarket>,
        asset: [u8; 8],
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;

        market.admin = ctx.accounts.admin.key();
        market.asset = asset;
        market.yes_pool = 0;
        market.no_pool = 0;
        market.resolved = false;
        market.outcome_yes = false;

        Ok(())
    }

    pub fn enter_yes(ctx: Context<EnterSide>, lamports: u64) -> Result<()> {
        enter(ctx, lamports, true)
    }

    pub fn enter_no(ctx: Context<EnterSide>, lamports: u64) -> Result<()> {
        enter(ctx, lamports, false)
    }
}

fn enter(ctx: Context<EnterSide>, lamports: u64, is_yes: bool) -> Result<()> {
    let market = &mut ctx.accounts.market;

    let ix = anchor_lang::system_program::Transfer {
        from: ctx.accounts.user.to_account_info(),
        to: ctx.accounts.vault.to_account_info(),
    };

    anchor_lang::system_program::transfer(
        CpiContext::new(ctx.accounts.system_program.to_account_info(), ix),
        lamports,
    )?;

    if is_yes {
        market.yes_pool += lamports;
    } else {
        market.no_pool += lamports;
    }

    Ok(())
}

#[derive(Accounts)]
#[instruction(asset: [u8; 8])]
pub struct InitializeMarket<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + Market::SIZE,
        seeds = [b"market", asset.as_ref()],
        bump
    )]
    pub market: Account<'info, Market>,

    /// CHECK: PDA authority, no data
    #[account(
        seeds = [b"authority", market.key().as_ref()],
        bump
    )]
    pub market_authority: UncheckedAccount<'info>,

    /// CHECK: SOL vault PDA
    #[account(
        mut,
        seeds = [b"vault", market.key().as_ref()],
        bump
    )]
    pub vault: UncheckedAccount<'info>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct EnterSide<'info> {
    #[account(mut)]
    pub market: Account<'info, Market>,

    /// CHECK: vault PDA
    #[account(
        mut,
        seeds = [b"vault", market.key().as_ref()],
        bump
    )]
    pub vault: UncheckedAccount<'info>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[account]
pub struct Market {
    pub admin: Pubkey,
    pub asset: [u8; 8],
    pub yes_pool: u64,
    pub no_pool: u64,
    pub resolved: bool,
    pub outcome_yes: bool,
}

impl Market {
    pub const SIZE: usize =
        32 + // admin
        8 +  // asset
        8 +  // yes_pool
        8 +  // no_pool
        1 +  // resolved
        1;   // outcome_yes
}
