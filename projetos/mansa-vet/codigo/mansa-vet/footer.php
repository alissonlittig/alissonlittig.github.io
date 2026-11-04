</main>
<footer class="site-footer">
	<div class="wrap footer-grid">
		<div>
			<p class="footer-brand">Mansa<small>clínica veterinária</small></p>
			<p class="muted"><?php echo esc_html( mansa_opt( 'address' ) ); ?></p>
		</div>
		<nav aria-label="Rodapé">
			<?php wp_nav_menu( array( 'theme_location' => 'footer', 'container' => false, 'fallback_cb' => 'mansa_fallback_menu', 'depth' => 1 ) ); ?>
		</nav>
		<div>
			<?php if ( is_active_sidebar( 'footer-notice' ) ) : dynamic_sidebar( 'footer-notice' ); else : ?>
				<p class="muted">Urgência 24h pelo telefone <strong><?php echo esc_html( mansa_opt( 'phone' ) ); ?></strong>.</p>
			<?php endif; ?>
		</div>
	</div>
	<div class="wrap legal">
		<span>© <?php echo esc_html( gmdate( 'Y' ) ); ?> Mansa Clínica Veterinária</span>
		<span>Negócio fictício · projeto de portfólio, tema WordPress próprio</span>
	</div>
</footer>
<?php wp_footer(); ?>
</body>
</html>
